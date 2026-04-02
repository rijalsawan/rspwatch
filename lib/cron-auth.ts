import type { NextRequest } from "next/server"
import { env } from "@/config/env"

export type RequestTriggerSource = "vercel-cron" | "cron-secret" | "manual-admin"

export function getRequestTriggerSource(request: NextRequest): RequestTriggerSource {
  if (!env.CRON_SECRET) return "manual-admin"

  const authorization = request.headers.get("authorization")
  if (authorization !== `Bearer ${env.CRON_SECRET}`) return "manual-admin"

  if (request.headers.get("x-vercel-cron") === "1") return "vercel-cron"

  return "cron-secret"

}

export function isTrustedCronRequest(request: NextRequest): boolean {
  return getRequestTriggerSource(request) !== "manual-admin"
}
