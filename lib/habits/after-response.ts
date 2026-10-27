import { after } from "next/server"

/**
 * Runs side work (a push, a log) once the response has gone out, so an
 * assistant's voice reply never waits on it. MCP calls route handlers
 * in-process, so the task attaches to the outer /mcp request. Outside a
 * request (tests, scripts) `after` throws: run it right away instead.
 * Never throws; failures are logged under `label`.
 */
export function runAfterResponse(label: string, task: () => Promise<unknown>): void {
  const run = () =>
    task().catch((error) => {
      console.warn(`[${label}]`, error instanceof Error ? error.message : error)
    })
  try {
    after(run)
  } catch {
    void run()
  }
}
