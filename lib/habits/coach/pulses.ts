import { canNudge } from "@/lib/habits/coach/limits"
import { duePulseSlot, pickPulse, pulsesPerDay } from "@/lib/habits/coach/pulse-rules"
import { coachLocale } from "@/lib/habits/coach/rules"
import type { CoachTickContext } from "@/lib/habits/coach/checkins"
import { hasPushDevice, pushConfigured, sendPush } from "@/lib/habits/push"
import { registerTickHandler } from "@/lib/habits/reminders/scheduler"

/**
 * Daytime pulses: a few unprompted pushes at random times (coach.pulsesPerDay,
 * off by default). They go through the same limits as every coach message
 * (quiet hours, maxNudgesPerDay, one per slot per day) and keep a gap from
 * any other coach message so they never land on top of a check-in.
 */

/** No pulse within this many minutes of another coach message. */
export const PULSE_MIN_GAP_MINUTES = 30

export type PulseTickContext = CoachTickContext & { now?: Date }

async function coachSentRecently(sql: CoachTickContext["sql"], userId: number, now: Date): Promise<boolean> {
  const since = new Date(now.getTime() - PULSE_MIN_GAP_MINUTES * 60_000)
  const rows = await sql`
    SELECT 1 FROM habit_notifications_sent
    WHERE user_id = ${userId} AND kind LIKE 'coach:%' AND sent_at >= ${since}
    LIMIT 1
  `
  return rows.length > 0
}

/** One user, one tick. Returns the slot sent, or null. Exported for tests. */
export async function runCoachPulses({ sql, userId, data, completions, localNow, now = new Date() }: PulseTickContext): Promise<number | null> {
  if (!pulsesPerDay(data) || !pushConfigured()) return null
  const slot = duePulseSlot(userId, data, localNow)
  if (slot === null) return null
  // Same reason as check-ins: without a device the claim would only use up the day's cap.
  if (!(await hasPushDevice(sql, userId))) return null
  if (await coachSentRecently(sql, userId, now)) return null

  const message = pickPulse({ data, completions, localNow, slot, locale: coachLocale(data), now })
  if (!message) return null
  const verdict = await canNudge({ sql, userId, kind: "pulse", localNow, data, channel: "push", slot })
  if (!verdict.allowed) return null
  await sendPush(userId, { title: message.title, body: message.body, tag: "coach-pulse", url: message.url })
  return slot
}

let registered = false

/** Hooks pulses into the reminder scheduler, after check-ins. Idempotent; runs on import (instrumentation.ts). */
export function registerCoachPulses(): void {
  if (registered) return
  registered = true
  registerTickHandler(async (context) => {
    try {
      await runCoachPulses(context)
    } catch (error) {
      console.error(`[coach] pulse failed for user ${context.userId}:`, error)
    }
  })
}

registerCoachPulses()
