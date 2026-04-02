import { NextRequest } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { env } from "@/config/env"
import { success, error } from "@/lib/api-response"
import { prisma } from "@/lib/prisma"
import { getAllScraperJobs, getFastScraperJobs, isScraperJob } from "@/scrapers/scraper-runner"

type IngestionMode = "FAST" | "ALL" | "SINGLE"
type IngestionTaskStatus = "SUCCESS" | "PARTIAL" | "FAILED" | "SKIPPED"

interface CallbackRunRecord {
  id: string
  mode: IngestionMode
  totalJobs: number
  startedAt: Date
}

interface IngestionCallbackTransaction {
  ingestionRun: {
    findUnique(args: {
      where: { id: string }
      select: { id: true; mode: true; totalJobs: true; startedAt: true }
    }): Promise<CallbackRunRecord | null>
    update(args: {
      where: { id: string }
      data: {
        status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED"
        succeededJobs: number
        failedJobs: number
        recordsCreated: number
        recordsUpdated: number
        endedAt: Date | null
        durationMs: number | null
        errors: Prisma.InputJsonValue | typeof Prisma.JsonNull
      }
    }): Promise<unknown>
  }
  ingestionTaskRun: {
    findMany(args: {
      where: { ingestionRunId: string }
      select: Record<string, true>
    }): Promise<
      Array<{
        jobName?: string
        status?: IngestionTaskStatus
        recordsCreated?: number
        recordsUpdated?: number
        errors?: string | null
      }>
    >
    upsert(args: {
      where: {
        ingestionRunId_jobName: {
          ingestionRunId: string
          jobName: string
        }
      }
      update: {
        status: CallbackPayload["status"]
        recordsFound: number
        recordsCreated: number
        recordsUpdated: number
        durationMs: number | null
        errors: string | null
        endedAt: Date
      }
      create: {
        ingestionRunId: string
        jobName: string
        status: CallbackPayload["status"]
        recordsFound: number
        recordsCreated: number
        recordsUpdated: number
        durationMs: number | null
        errors: string | null
        startedAt: Date
        endedAt: Date
      }
    }): Promise<unknown>
  }
  scrapeLog: {
    create(args: {
      data: {
        jobName: string
        status: "SUCCESS" | "PARTIAL" | "FAILED"
        recordsFound: number
        recordsCreated: number
        recordsUpdated: number
        durationMs: number | null
        errorMessage: string | null
        ingestionRunId: string
      }
    }): Promise<unknown>
  }
}

export const maxDuration = 60

const callbackPayloadSchema = z.object({
  runId: z.string().min(1),
  jobName: z.string().min(1),
  status: z.enum(["SUCCESS", "PARTIAL", "FAILED", "SKIPPED"]),
  recordsFound: z.number().int().min(0).default(0),
  recordsCreated: z.number().int().min(0).default(0),
  recordsUpdated: z.number().int().min(0).default(0),
  durationMs: z.number().int().min(0).nullable().optional(),
  errors: z.array(z.string().min(1)).default([]),
})

type CallbackPayload = z.infer<typeof callbackPayloadSchema>

function isAuthorized(request: NextRequest): boolean {
  if (!env.EXTERNAL_RUNNER_SECRET) return false
  return request.headers.get("authorization") === `Bearer ${env.EXTERNAL_RUNNER_SECRET}`
}

function mapTaskStatusToScrapeStatus(
  status: CallbackPayload["status"]
): "SUCCESS" | "PARTIAL" | "FAILED" {
  if (status === "SUCCESS") return "SUCCESS"
  if (status === "FAILED") return "FAILED"
  return "PARTIAL"
}

function deriveRunStatus(
  totalJobs: number,
  completedJobs: number,
  failedJobs: number,
  partialJobs: number,
  skippedJobs: number
): "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED" {
  if (completedJobs < totalJobs) return "RUNNING"
  if (failedJobs === 0 && partialJobs === 0 && skippedJobs === 0) return "SUCCESS"
  if (failedJobs === totalJobs && partialJobs === 0 && skippedJobs === 0) return "FAILED"
  return "PARTIAL"
}

function getAllowedJobsForMode(
  mode: IngestionMode,
  existingTaskJobNames: string[]
): Set<string> {
  if (mode === "FAST") return new Set(getFastScraperJobs())
  if (mode === "ALL") return new Set(getAllScraperJobs())
  if (existingTaskJobNames.length > 0) return new Set(existingTaskJobNames)
  return new Set(getAllScraperJobs())
}

export async function POST(request: NextRequest) {
  if (!env.EXTERNAL_RUNNER_SECRET) {
    return error("EXTERNAL_RUNNER_SECRET is not configured", 500)
  }

  if (!isAuthorized(request)) {
    return error("Unauthorized", 401)
  }

  try {
    const payload = callbackPayloadSchema.parse(await request.json())
    if (!isScraperJob(payload.jobName)) {
      return error(`Invalid callback job: ${payload.jobName}`, 400)
    }

    const now = new Date()
    const serializedErrors = payload.errors.length > 0 ? payload.errors.join("\n") : null

    const result = await prisma.$transaction(async (tx) => {
      const callbackTx = tx as unknown as IngestionCallbackTransaction

      const run = await callbackTx.ingestionRun.findUnique({
        where: { id: payload.runId },
        select: {
          id: true,
          mode: true,
          totalJobs: true,
          startedAt: true,
        },
      })

      if (!run) {
        return { notFound: true as const }
      }

      const existingTasks = await callbackTx.ingestionTaskRun.findMany({
        where: { ingestionRunId: payload.runId },
        select: { jobName: true },
      })

      const allowedJobs = getAllowedJobsForMode(
        run.mode,
        existingTasks
          .map((task) => task.jobName)
          .filter((value): value is string => Boolean(value))
      )

      if (!allowedJobs.has(payload.jobName)) {
        throw new Error(
          `Callback job ${payload.jobName} is not expected for run mode ${run.mode}`
        )
      }

      await callbackTx.ingestionTaskRun.upsert({
        where: {
          ingestionRunId_jobName: {
            ingestionRunId: payload.runId,
            jobName: payload.jobName,
          },
        },
        update: {
          status: payload.status,
          recordsFound: payload.recordsFound,
          recordsCreated: payload.recordsCreated,
          recordsUpdated: payload.recordsUpdated,
          durationMs: payload.durationMs ?? null,
          errors: serializedErrors,
          endedAt: now,
        },
        create: {
          ingestionRunId: payload.runId,
          jobName: payload.jobName,
          status: payload.status,
          recordsFound: payload.recordsFound,
          recordsCreated: payload.recordsCreated,
          recordsUpdated: payload.recordsUpdated,
          durationMs: payload.durationMs ?? null,
          errors: serializedErrors,
          startedAt: now,
          endedAt: now,
        },
      })

      await callbackTx.scrapeLog.create({
        data: {
          jobName: payload.jobName,
          status: mapTaskStatusToScrapeStatus(payload.status),
          recordsFound: payload.recordsFound,
          recordsCreated: payload.recordsCreated,
          recordsUpdated: payload.recordsUpdated,
          durationMs: payload.durationMs ?? null,
          errorMessage: serializedErrors,
          ingestionRunId: payload.runId,
        },
      })

      const taskRuns = await callbackTx.ingestionTaskRun.findMany({
        where: { ingestionRunId: payload.runId },
        select: {
          status: true,
          recordsCreated: true,
          recordsUpdated: true,
          errors: true,
        },
      })

      const completedJobs = taskRuns.length
      const failedJobs = taskRuns.filter((task) => task.status === "FAILED").length
      const partialJobs = taskRuns.filter((task) => task.status === "PARTIAL").length
      const skippedJobs = taskRuns.filter((task) => task.status === "SKIPPED").length
      const succeededJobs = taskRuns.filter((task) => task.status === "SUCCESS").length

      const recordsCreated = taskRuns.reduce((sum, task) => sum + (task.recordsCreated ?? 0), 0)
      const recordsUpdated = taskRuns.reduce((sum, task) => sum + (task.recordsUpdated ?? 0), 0)

      const runStatus = deriveRunStatus(
        run.totalJobs,
        completedJobs,
        failedJobs,
        partialJobs,
        skippedJobs
      )

      const runErrors = taskRuns
        .filter((task) => Boolean(task.errors))
        .map((task) => task.errors)
        .filter((value): value is string => Boolean(value))

      await callbackTx.ingestionRun.update({
        where: { id: payload.runId },
        data: {
          status: runStatus,
          succeededJobs,
          failedJobs,
          recordsCreated,
          recordsUpdated,
          endedAt: runStatus === "RUNNING" ? null : now,
          durationMs: runStatus === "RUNNING" ? null : now.getTime() - run.startedAt.getTime(),
          errors: runErrors.length > 0 ? runErrors : Prisma.JsonNull,
        },
      })

      return {
        notFound: false as const,
        run,
        runStatus,
        completedJobs,
        succeededJobs,
        failedJobs,
        skippedJobs,
        recordsCreated,
        recordsUpdated,
      }
    })

    if (result.notFound) {
      return error("Ingestion run not found", 404)
    }

    return success({
      runId: payload.runId,
      jobName: payload.jobName,
      accepted: true,
      runStatus: result.runStatus,
      completedJobs: result.completedJobs,
      totalJobs: result.run.totalJobs,
      succeededJobs: result.succeededJobs,
      failedJobs: result.failedJobs,
      skippedJobs: result.skippedJobs,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
    })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return error(`Invalid payload: ${e.issues.map((issue) => issue.message).join(", ")}`, 400)
    }

    console.error("[cron/external-callback] Error:", e)
    return error("Failed to process external callback", 500)
  }
}
