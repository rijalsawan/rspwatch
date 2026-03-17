import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_SECRET: z.string().min(16),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Scraping config overrides
  SCRAPE_PARLIAMENT_INTERVAL: z.string().default("0 */6 * * *"), // every 6h
  SCRAPE_NEWS_INTERVAL: z.string().default("0 */2 * * *"),       // every 2h
  SCRAPE_REQUEST_DELAY_MS: z.coerce.number().default(2000),
  SCRAPE_MAX_RETRIES: z.coerce.number().default(3),
  // RSP governance start date — used for "days in power" calculation
  RSP_GOVERNANCE_START: z.string().default("2026-03-01"),
})

export type Env = z.infer<typeof envSchema>

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors)
    throw new Error("Invalid environment variables")
  }
  return parsed.data
}

export const env = getEnv()
