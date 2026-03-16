/**
 * Module-level in-memory cache for client-side fetches.
 *
 * Because this module is a singleton in the browser tab, cached values survive
 * React component mount/unmount cycles (i.e. page navigations in Next.js App
 * Router). A hard page refresh (F5) reinitialises the module and clears all
 * entries — exactly the behaviour we want.
 */

interface CacheEntry<T = unknown> {
  data: T
  ts: number
}

const STORE = new Map<string, CacheEntry>()

export const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = STORE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) {
    STORE.delete(key)
    return null
  }
  return entry.data as T
}

export function setCached<T>(key: string, data: T): void {
  STORE.set(key, { data, ts: Date.now() })
}

export function bustCache(key?: string): void {
  if (key) STORE.delete(key)
  else STORE.clear()
}
