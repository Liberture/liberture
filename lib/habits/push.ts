import webpush from "web-push"

import { getDb } from "@/lib/habits/db"
import { createPushTables } from "@/lib/habits/db-migrate"
import { zonedToUtc } from "@/lib/habits/api/time-zone"
import { DEFAULT_COACH_PREFERENCES, type UserPreferences } from "@/lib/habits/types"
import { formatDateInTimeZone } from "@/lib/habits/date-utils"

/**
 * Web Push for reminders that arrive with the app closed, plus the ledger that
 * keeps every notification (server push, in-tab fallback, coach check-in) from
 * being shown twice. Node runtime only: web-push signs with node:crypto.
 */

type Sql = ReturnType<typeof getDb>

export interface PushPayload {
  title: string
  body: string
  /** Same tag replaces an earlier notification on the device instead of stacking. */
  tag: string
  /** Opened by the service worker on click. */
  url: string
}

/** What PushSubscription.toJSON() gives in the browser. */
export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface SendPushResult {
  /** Subscriptions the push service accepted the message for. */
  sent: number
  failed: number
  /** Subscriptions dropped because the push service said they are gone (404/410). */
  removed: number
}

/** "assistant": a nudge an external automation recorded through MCP (record_coach_nudge). */
export type NotificationChannel = "push" | "local" | "assistant"

const DEFAULT_SUBJECT = "mailto:hello@liberture.com"
/** A reminder that arrives half an hour late is noise: let the push service drop it. */
const PUSH_TTL_SECONDS = 30 * 60

interface VapidConfig {
  publicKey: string
  privateKey: string
  subject: string
}

function vapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT?.trim() || DEFAULT_SUBJECT }
}

/** Whether this instance can send Web Push (VAPID keys set). */
export function pushConfigured(): boolean {
  return vapidConfig() !== null
}

/** The applicationServerKey browsers subscribe with, or null when push is not configured. */
export function vapidPublicKey(): string | null {
  return vapidConfig()?.publicKey ?? null
}

let tablesReady: Promise<void> | null = null

/** Creates the push tables once per process (Docker deployments don't run `prisma db push`). */
export function ensurePushTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = createPushTables().catch((error) => {
      tablesReady = null
      throw error
    })
  }
  return tablesReady
}

export function isPushSubscriptionInput(value: unknown): value is PushSubscriptionInput {
  if (!value || typeof value !== "object") return false
  const sub = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  if (typeof sub.endpoint !== "string" || !/^https:\/\//.test(sub.endpoint) || sub.endpoint.length > 2048) return false
  return typeof sub.keys?.p256dh === "string" && typeof sub.keys?.auth === "string"
    && sub.keys.p256dh.length <= 512 && sub.keys.auth.length <= 512
}

/** Stores (or re-assigns) a device's subscription. A browser has one endpoint, whoever is signed in on it. */
export async function saveSubscription(
  userId: number,
  subscription: PushSubscriptionInput,
  userAgent?: string | null,
): Promise<void> {
  await ensurePushTables()
  const sql = getDb()
  await sql`
    INSERT INTO habit_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
    VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${userAgent?.slice(0, 512) ?? null})
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_agent = COALESCE(EXCLUDED.user_agent, habit_push_subscriptions.user_agent),
      failures = 0
  `
}

/**
 * The service worker re-subscribes on `pushsubscriptionchange` without any
 * credentials. Knowing the old endpoint (an unguessable capability URL) is the
 * proof: the new subscription takes over that row's user. Returns the user id,
 * or null when the old endpoint is unknown.
 */
export async function replaceSubscription(
  oldEndpoint: string,
  subscription: PushSubscriptionInput,
  userAgent?: string | null,
): Promise<number | null> {
  await ensurePushTables()
  const sql = getDb()
  const rows = await sql`SELECT user_id FROM habit_push_subscriptions WHERE endpoint = ${oldEndpoint}`
  const userId = rows[0]?.user_id as number | undefined
  if (!userId) return null
  if (oldEndpoint !== subscription.endpoint) {
    await sql`DELETE FROM habit_push_subscriptions WHERE endpoint = ${oldEndpoint}`
  }
  await saveSubscription(userId, subscription, userAgent)
  return userId
}

export async function removeSubscription(userId: number, endpoint: string): Promise<boolean> {
  await ensurePushTables()
  const sql = getDb()
  const rows = await sql`
    DELETE FROM habit_push_subscriptions WHERE user_id = ${userId} AND endpoint = ${endpoint} RETURNING id
  `
  return rows.length > 0
}

/** Sends to every device the user subscribed. Gone endpoints are deleted; the rest record success or failure. */
export async function sendPush(userId: number, payload: PushPayload): Promise<SendPushResult> {
  const vapid = vapidConfig()
  const result: SendPushResult = { sent: 0, failed: 0, removed: 0 }
  if (!vapid) return result

  await ensurePushTables()
  const sql = getDb()
  const subscriptions = await sql`
    SELECT id, endpoint, p256dh, auth FROM habit_push_subscriptions WHERE user_id = ${userId}
  `
  const body = JSON.stringify(payload)

  await Promise.all(subscriptions.map(async (row) => {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint as string, keys: { p256dh: row.p256dh as string, auth: row.auth as string } },
        body,
        { vapidDetails: vapid, TTL: PUSH_TTL_SECONDS, urgency: "normal" },
      )
      result.sent++
      await sql`UPDATE habit_push_subscriptions SET last_success_at = NOW(), failures = 0 WHERE id = ${row.id}`
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        result.removed++
        await sql`DELETE FROM habit_push_subscriptions WHERE id = ${row.id}`
        return
      }
      result.failed++
      console.warn(`[push] delivery failed for user ${userId} (status ${status ?? "n/a"})`)
      await sql`
        UPDATE habit_push_subscriptions
        SET last_failure_at = NOW(), failures = failures + 1
        WHERE id = ${row.id}
      `
    }
  }))

  return result
}

/**
 * Claims a notification before it is shown. Only the first caller for a
 * (user, dedupeKey) gets true: a server tick, several open tabs and other
 * devices can all race for the same reminder and exactly one shows it.
 */
export async function claimNotification(
  userId: number,
  dedupeKey: string,
  kind: string,
  channel: NotificationChannel,
  sql: Sql = getDb(),
): Promise<boolean> {
  await ensurePushTables()
  const rows = await sql`
    INSERT INTO habit_notifications_sent (user_id, dedupe_key, kind, channel)
    VALUES (${userId}, ${dedupeKey}, ${kind}, ${channel})
    ON CONFLICT (user_id, dedupe_key) DO NOTHING
    RETURNING dedupe_key
  `
  return rows.length > 0
}

/** Notifications claimed since the start of the user's local day whose kind starts with `kindPrefix` ("" = all). */
export async function countSentToday(
  userId: number,
  kindPrefix: string,
  localDayStartUtc: Date,
  sql: Sql = getDb(),
): Promise<number> {
  await ensurePushTables()
  const pattern = `${kindPrefix.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM habit_notifications_sent
    WHERE user_id = ${userId} AND sent_at >= ${localDayStartUtc} AND kind LIKE ${pattern}
  `
  return (rows[0]?.count as number | undefined) ?? 0
}

/** UTC instant of local midnight today in `timeZone` (the server's zone when unset). */
export function localDayStartUtc(timeZone: string | undefined, now: Date = new Date()): Date {
  const zone = timeZone || process.env.HABIT_TRACKER_TIME_ZONE || undefined
  const today = formatDateInTimeZone(now, zone)
  const iso = zonedToUtc(`${today}T00:00`, zone)
  const parsed = new Date(iso)
  if (!Number.isNaN(parsed.getTime()) && iso.endsWith("Z")) return parsed
  const [y, m, d] = today.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export interface ReminderStatus {
  /** Server push is set up on this instance (VAPID keys). */
  pushConfigured: boolean
  /** preferences.notifications: reminders on for this account. */
  notifications: boolean
  /** Subscribed browsers/devices. */
  devices: number
  lastDeliveredAt: string | null
  lastFailureAt: string | null
  quietHours: { start: string; end: string }
  /** Notifications claimed since local midnight: all, and split into habit reminders and coach nudges. */
  sentToday: number
  sentTodayByKind: { habit: number; coach: number }
}

export async function reminderStatus(userId: number, now: Date = new Date()): Promise<ReminderStatus> {
  await ensurePushTables()
  const sql = getDb()
  const [prefRows, subRows] = await Promise.all([
    sql`SELECT data->'preferences' AS preferences FROM habit_users WHERE id = ${userId}`,
    sql`
      SELECT COUNT(*)::int AS devices, MAX(last_success_at) AS last_success, MAX(last_failure_at) AS last_failure
      FROM habit_push_subscriptions WHERE user_id = ${userId}
    `,
  ])
  const preferences = (prefRows[0]?.preferences ?? {}) as UserPreferences
  const dayStart = localDayStartUtc(preferences.timeZone, now)
  const [all, habit, coach] = await Promise.all([
    countSentToday(userId, "", dayStart, sql),
    countSentToday(userId, "habit", dayStart, sql),
    countSentToday(userId, "coach", dayStart, sql),
  ])
  const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : typeof value === "string" ? value : null)
  return {
    pushConfigured: pushConfigured(),
    notifications: preferences.notifications !== false,
    devices: (subRows[0]?.devices as number | undefined) ?? 0,
    lastDeliveredAt: iso(subRows[0]?.last_success),
    lastFailureAt: iso(subRows[0]?.last_failure),
    quietHours: preferences.coach?.quietHours ?? DEFAULT_COACH_PREFERENCES.quietHours,
    sentToday: all,
    sentTodayByKind: { habit, coach },
  }
}
