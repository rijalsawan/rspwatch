import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  runScraper,
  type RunResult,
  type ScraperJobName,
} from "./scraper-runner"

interface IngestionLockDelegate {
  create(args: {
    data: {
      key: string
      ownerToken: string
      lockedUntil: Date
    }
  }): Promise<unknown>
  updateMany(args: {
    where: {
      key: string
      lockedUntil?: { lt: Date }
      ownerToken?: string
    }
    data: {
      ownerToken: string | null
      lockedUntil: Date
    }
  }): Promise<{ count: number }>
  findUnique(args: {
    where: { key: string }
    select: { lockedUntil: true }
  }): Promise<{ lockedUntil: Date } | null>
}

interface IngestionRunDelegate {
  create(args: {
    data: {
      mode: RunMode
      status: "RUNNING"
      triggerSource: TriggerSource
      triggeredBy: string | null
      requestedByIp: string | null
      totalJobs: number
    }
    select: {
      id: true
      startedAt: true
    }
  }): Promise<{ id: string; startedAt: Date }>
  update(args: {
    where: { id: string }
    data: {
      status: "SUCCESS" | "PARTIAL" | "FAILED"
      endedAt: Date
      durationMs?: number
      succeededJobs?: number
      failedJobs?: number
      recordsCreated?: number
      recordsUpdated?: number
      errors?: Prisma.InputJsonValue | typeof Prisma.JsonNull
    }
  }): Promise<unknown>
}

interface IngestionTaskRunDelegate {
  create(args: {
    data: {
      ingestionRunId: string
      jobName: string
      status: "SUCCESS" | "PARTIAL" | "FAILED"
      recordsFound: number
      recordsCreated: number
      recordsUpdated: number
      durationMs: number
      errors: string | null
      startedAt: Date
      endedAt: Date
    }
  }): Promise<unknown>
}

interface IngestionDbClient {
  ingestionLock: IngestionLockDelegate
  ingestionRun: IngestionRunDelegate
  ingestionTaskRun: IngestionTaskRunDelegate
}

const ingestionDb = prisma as unknown as IngestionDbClient

const INGESTION_LOCK_KEY = "global-scrape-lock"
const DEFAULT_LOCK_TTL_MS = 25 * 60 * 1000

type TriggerSource =
  | "vercel-cron"
  | "cron-secret"
  | "manual-admin"
  | "external-runner"
  | "in-memory-scheduler"

type RunMode = "FAST" | "ALL" | "SINGLE"

export interface ExecuteIngestionRunOptions {
  jobs: ScraperJobName[]
  runMode: RunMode
  triggerSource: TriggerSource
  triggeredBy?: string | null
  requestedByIp?: string | null
  lockTtlMs?: number
}

interface LockAcquired {
  acquired: true
  ownerToken: string
  lockedUntil: Date
}

interface LockRejected {
  acquired: false
  lockedUntil: Date | null
}

type LockResult = LockAcquired | LockRejected

export interface IngestionRunRejectedResult {
  started: false
  reason: "LOCKED"
  lockedUntil: string | null
}

export interface IngestionRunSuccessResult {
  started: true
  runId: string
  status: "SUCCESS" | "PARTIAL" | "FAILED"
  runMode: RunMode
  triggerSource: TriggerSource
  durationMs: number
  totalJobs: number
  succeededJobs: number
  failedJobs: string[]
  recordsCreated: number
  recordsUpdated: number
  results: Record<string, RunResult>
}

export type IngestionExecutionResult =
  | IngestionRunRejectedResult
  | IngestionRunSuccessResult

function isPrismaKnownError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError
}

async function acquireIngestionLock(ttlMs: number): Promise<LockResult> {
  const ownerToken = randomUUID()
  const now = new Date()
  const lockedUntil = new Date(now.getTime() + ttlMs)

  try {
    await ingestionDb.ingestionLock.create({
      data: {
        key: INGESTION_LOCK_KEY,
        ownerToken,
        lockedUntil,
      },
    })

    return { acquired: true, ownerToken, lockedUntil }
  } catch (err) {
    if (!isPrismaKnownError(err) || err.code !== "P2002") {
      throw err
    }
  }

  const updateResult = await ingestionDb.ingestionLock.updateMany({
    where: {
      key: INGESTION_LOCK_KEY,
      lockedUntil: { lt: now },
    },
    data: {
      ownerToken,
      lockedUntil,
    },
  })

  if (updateResult.count === 1) {
    return { acquired: true, ownerToken, lockedUntil }
  }

  const existing = await ingestionDb.ingestionLock.findUnique({
    where: { key: INGESTION_LOCK_KEY },
    select: { lockedUntil: true },
  })

  return { acquired: false, lockedUntil: existing?.lockedUntil ?? null }
}

async function releaseIngestionLock(ownerToken: string): Promise<void> {
  await ingestionDb.ingestionLock.updateMany({
    where: {
      key: INGESTION_LOCK_KEY,
      ownerToken,
    },
    data: {
      ownerToken: null,
      lockedUntil: new Date(0),
    },
  })
}

function normalizeJobs(jobs: ScraperJobName[]): ScraperJobName[] {
  return Array.from(new Set(jobs))
}

function mapResultToTaskStatus(status: RunResult["status"]): "SUCCESS" | "PARTIAL" | "FAILED" {
  if (status === "SUCCESS") return "SUCCESS"
  if (status === "PARTIAL") return "PARTIAL"
  return "FAILED"
}

function deriveRunStatus(
  failedCount: number,
  partialCount: number,
  totalJobs: number
): "SUCCESS" | "PARTIAL" | "FAILED" {
  if (failedCount === 0 && partialCount === 0) return "SUCCESS"
  if (failedCount === totalJobs && partialCount === 0) return "FAILED"
  return "PARTIAL"
}

export async function executeIngestionRun(
  options: ExecuteIngestionRunOptions
): Promise<IngestionExecutionResult> {
  const jobs = normalizeJobs(options.jobs)
  if (jobs.length === 0) {
    throw new Error("No jobs provided for ingestion run")
  }

  const lockResult = await acquireIngestionLock(options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS)
  if (!lockResult.acquired) {
    return {
      started: false,
      reason: "LOCKED",
      lockedUntil: lockResult.lockedUntil ? lockResult.lockedUntil.toISOString() : null,
    }
  }

  let runId: string | null = null

  try {
    const run = await ingestionDb.ingestionRun.create({
      data: {
        mode: options.runMode,
        status: "RUNNING",
        triggerSource: options.triggerSource,
        triggeredBy: options.triggeredBy ?? null,
        requestedByIp: options.requestedByIp ?? null,
        totalJobs: jobs.length,
      },
      select: {
        id: true,
        startedAt: true,
      },
    })

    runId = run.id
    const results: Record<string, RunResult> = {}
    const failedJobs: string[] = []
    let partialCount = 0
    let succeededCount = 0
    let recordsCreated = 0
    let recordsUpdated = 0

    for (const jobName of jobs) {
      const taskStartedAt = new Date()
      const result = await runScraper(jobName, { ingestionRunId: run.id })
      const taskEndedAt = new Date()

      results[jobName] = result
      recordsCreated += result.recordsCreated
      recordsUpdated += result.recordsUpdated

      if (result.status === "FAILED") {
        failedJobs.push(jobName)
      } else if (result.status === "PARTIAL") {
        partialCount += 1
      } else {
        succeededCount += 1
      }

      await ingestionDb.ingestionTaskRun.create({
        data: {
          ingestionRunId: run.id,
          jobName,
          status: mapResultToTaskStatus(result.status),
          recordsFound: result.recordsFound,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          durationMs: result.durationMs,
          errors: result.errors.length > 0 ? result.errors.join("\n") : null,
          startedAt: taskStartedAt,
          endedAt: taskEndedAt,
        },
      })
    }

    const endedAt = new Date()
    const runStatus = deriveRunStatus(failedJobs.length, partialCount, jobs.length)

    await ingestionDb.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: runStatus,
        endedAt,
        durationMs: endedAt.getTime() - run.startedAt.getTime(),
        succeededJobs: succeededCount,
        failedJobs: failedJobs.length,
        recordsCreated,
        recordsUpdated,
        errors: failedJobs.length > 0 ? failedJobs : Prisma.JsonNull,
      },
    })

    return {
      started: true,
      runId: run.id,
      status: runStatus,
      runMode: options.runMode,
      triggerSource: options.triggerSource,
      durationMs: endedAt.getTime() - run.startedAt.getTime(),
      totalJobs: jobs.length,
      succeededJobs: succeededCount,
      failedJobs,
      recordsCreated,
      recordsUpdated,
      results,
    }
  } catch (err) {
    if (runId) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      await ingestionDb.ingestionRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          endedAt: new Date(),
          errors: [errorMessage],
        },
      })
    }

    throw err
  } finally {
    await releaseIngestionLock(lockResult.ownerToken)
  }
}
