import { NextRequest } from "next/server"
import { error } from "./api-response"

export function validateAdmin(request: NextRequest) {
  const secret = request.headers.get("x-admin-secret")
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return error("Unauthorized", 401)
  }
  return null // null means valid
}
