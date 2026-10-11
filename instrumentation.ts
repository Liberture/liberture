/**
 * Runs once when a Next.js server process starts. Starts the reminder
 * scheduler (server push for reminders with the app closed) in the Node
 * runtime only. Off with REMINDER_SCHEDULER=off or when VAPID keys are unset.
 * Also runs a one-time security repair of derived internal API keys.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  // Security repair, before anything else: replace Nostr accounts' internal
  // api_key that was derived from the public key (lib/habits/internal-api-key.ts).
  if (process.env.DATABASE_URL) {
    try {
      const [{ getDb }, { rotateDerivedApiKeys }] = await Promise.all([
        import("./lib/habits/db"),
        import("./lib/habits/internal-api-key"),
      ])
      const rotated = await rotateDerivedApiKeys(getDb())
      if (rotated) console.info(`[security] replaced ${rotated} derived internal API key(s)`)
    } catch (error) {
      console.warn("[security] could not rotate derived API keys:", error instanceof Error ? error.message : error)
    }
  }

  if (process.env.REMINDER_SCHEDULER === "off") {
    console.info("[reminders] scheduler disabled (REMINDER_SCHEDULER=off)")
    return
  }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.info("[reminders] scheduler not started: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set")
    return
  }
  if (!process.env.DATABASE_URL) {
    console.info("[reminders] scheduler not started: DATABASE_URL not set")
    return
  }

  try {
    const { startReminderScheduler } = await import("./lib/habits/reminders/scheduler")
    // Coach check-ins register themselves on the same tick, when that module exists.
    try {
      await import("./lib/habits/coach/checkins")
    } catch {
      // Not present on this build.
    }
    startReminderScheduler()
  } catch (error) {
    console.warn("[reminders] scheduler failed to start:", error instanceof Error ? error.message : error)
  }
}
