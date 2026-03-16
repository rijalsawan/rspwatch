import { NextResponse } from "next/server"

interface ApiSuccessResponse<T> {
  data: T
  meta?: Record<string, unknown>
  error?: never
}

interface ApiErrorResponse {
  data?: never
  meta?: never
  error: string
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function success<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const body: ApiResponse<T> = { data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status })
}

export function error(message: string, status = 500) {
  const body: ApiErrorResponse = { error: message }
  return NextResponse.json(body, { status })
}

export function paginated<T>(
  data: T[],
  opts: { total: number; page: number; limit: number }
) {
  return success(data, {
    total: opts.total,
    page: opts.page,
    limit: opts.limit,
    hasMore: opts.page * opts.limit < opts.total,
  })
}

export function cursorPaginated<T>(
  data: T[],
  opts: { limit: number; nextCursor: string | null }
) {
  return success(data, {
    hasMore: opts.nextCursor !== null,
    nextCursor: opts.nextCursor,
  })
}
