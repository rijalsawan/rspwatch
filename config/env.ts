import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_SECRET: z.string().min(16),
  CRON_SECRET: z.string().min(16).optional(),
  EXTERNAL_RUNNER_SECRET: z.string().min(16).optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  ENABLE_IN_MEMORY_SCHEDULER: z.enum(["true", "false"]).default("false").optional(),
  // Scraping config overrides
  SCRAPE_PARLIAMENT_INTERVAL: z.string().default("0 */6 * * *"), // every 6h
  SCRAPE_NEWS_INTERVAL: z.string().default("0 */2 * * *"),       // every 2h
  SCRAPE_REQUEST_DELAY_MS: z.coerce.number().default(2000),
  SCRAPE_MAX_RETRIES: z.coerce.number().default(3),
  DISABLE_SCHEDULER: z.enum(["true", "false"]).default("false").optional(),
  // RSP governance start date — used for "days in power" calculation
  RSP_GOVERNANCE_START: z.string().default("2026-03-01"),
})

export type Env = z.infer<typeof envSchema>

function assertRuntimeGuards(env: Env): void {
  if (env.NODE_ENV !== "production") return

  const missing: string[] = []
  if (!env.CRON_SECRET) missing.push("CRON_SECRET")
  if (!env.EXTERNAL_RUNNER_SECRET) missing.push("EXTERNAL_RUNNER_SECRET")

  if (missing.length > 0) {
    throw new Error(`Missing required production secrets: ${missing.join(", ")}`)
  }
}

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  }
  assertRuntimeGuards(parsed.data)
  return parsed.data
}

export const env = getEnv()

export function isVercelRuntime(): boolean {
  return env.VERCEL === "1" || Boolean(env.VERCEL_ENV)
}

export function shouldStartInMemoryScheduler(): boolean {
  if (env.DISABLE_SCHEDULER === "true") return false
  if (isVercelRuntime()) return false
  return env.ENABLE_IN_MEMORY_SCHEDULER === "true"
}
