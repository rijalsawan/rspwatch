"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getCached, setCached, bustCache, DEFAULT_TTL } from "@/lib/client-cache"

interface Options {
  /** Cache TTL in ms. Default: 5 minutes. */
  ttl?: number
  /**
   * Set to true to skip the cache and always re-fetch.
   * Useful for pages that need fresh data unconditionally.
   */
  noCache?: boolean
}

interface Result<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** Force a fresh fetch and update the cache. */
  refetch: () => void
}

/**
 * Drop-in replacement for useEffect + fetch patterns.
 *
 * On first visit: fetches and writes to the module-level cache.
 * On revisit (same URL): reads instantly from the cache — no network round-trip.
 * On filter/URL change: cache miss for the new URL, fetches fresh data.
 * On manual refetch(): busts the cache key and re-fetches.
 * On page hard-refresh (F5): module re-initialises, cache is empty — fetches again.
 *
 * Usage:
 *   const { data, loading } = useCachedFetch<MyResponseType>("/api/something")
 *   const { data, loading } = useCachedFetch<MyResponseType>(url) // url may include query params
 */
export function useCachedFetch<T>(url: string | null, options?: Options): Result<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL
  const noCache = options?.noCache ?? false

  // Initialise from cache synchronously so there's no loading flash on revisit
  const [data, setData] = useState<T | null>(() =>
    !noCache && url ? getCached<T>(url, ttl) : null
  )
  const [loading, setLoading] = useState<boolean>(!data && !!url)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const execute = useCallback(
    async (targetUrl: string, force: boolean) => {
      if (!force && !noCache) {
        const cached = getCached<T>(targetUrl, ttl)
        if (cached !== null) {
          setData(cached)
          setLoading(false)
          return
        }
      }

      abortRef.current?.abort()
      abortRef.current = new AbortController()
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(targetUrl, { signal: abortRef.current.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: T = await res.json()
        if (!noCache) setCached<T>(targetUrl, json)
        setData(json)
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message)
        }
      } finally {
        setLoading(false)
      }
    },
    [ttl, noCache]
  )

  useEffect(() => {
    if (!url) return

    // If already have fresh cache, skip the network call
    if (!noCache && getCached<T>(url, ttl) !== null) {
      // Already initialised from cache — nothing to do
      setLoading(false)
      return
    }

    setLoading(true)
    execute(url, false)
    return () => abortRef.current?.abort()
  }, [url, execute, ttl, noCache])

  const refetch = useCallback(() => {
    if (!url) return
    bustCache(url)
    execute(url, true)
  }, [url, execute])

  return { data, loading, error, refetch }
}
