import { AsyncLocalStorage } from "node:async_hooks"

export interface ScrapeContext {
  ingestionRunId?: string
  warnings: string[]
}

const scrapeContextStorage = new AsyncLocalStorage<ScrapeContext>()

export async function runWithScrapeContext<T>(
  context: ScrapeContext,
  fn: () => Promise<T>
): Promise<T> {
  return scrapeContextStorage.run(context, fn)
}

export function getCurrentScrapeContext(): ScrapeContext | undefined {
  return scrapeContextStorage.getStore()
}

export function addScrapeContextWarning(message: string): void {
  const context = scrapeContextStorage.getStore()
  if (!context) return
  context.warnings.push(message)
}
