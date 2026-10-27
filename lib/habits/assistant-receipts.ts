import { runAfterResponse } from "@/lib/habits/after-response"
import { coachLocale, openTodosDueBy, todayProgress } from "@/lib/habits/coach/rules"
import { getDb } from "@/lib/habits/db"
import { connectionName } from "@/lib/habits/oauth/store"
import { getCompletionRows } from "@/lib/habits/optimized-storage"
import {
  claimNotification,
  countSentToday,
  ensurePushTables,
  hasPushDevice,
  localDayStartUtc,
  pushConfigured,
  sendPush,
} from "@/lib/habits/push"
import { createPushAction, deletePushAction, type PushAction } from "@/lib/habits/push-actions"
import type { HabitCompletion, StorageData, Todo } from "@/lib/habits/types"
import { formatMessage, plural } from "@/lib/i18n-format"
import { translations, type Locale } from "@/lib/translations"

/**
 * Receipts: when an assistant (MCP, Custom GPT action, the Claude skill)
 * marks a habit or todo done, every subscribed device gets "Claude logged
 * Meditation · 3 of 5 habits done today" with an Undo button. Called only
 * from the /api/v1 write handlers, which the web tracker never uses, so a
 * tap in the app never sends one. Not subject to quiet hours or the coach
 * cap: it answers something the user just asked for.
 */

type Sql = ReturnType<typeof getDb>

export type AssistantLogItem =
  | { type: "habit"; habitId: string; name: string; date: string; completedAt: string; previous: HabitCompletion | null }
  | { type: "todo"; todoId: string; name: string; completedAt: string; previous: { status: Todo["status"]; completedAt?: string } }

export interface AssistantLogInput {
  userId: number
  /** habit_api_connections.id of the token that logged it; null for script tokens. */
  connectionId: string | null
  /** The user's local date when it was logged. */
  today: string
  item: AssistantLogItem
}

export type ReceiptOutcome = "sent" | "off" | "no_device" | "daily_cap" | "duplicate" | "not_delivered" | "push_not_configured"

/** A runaway automation shouldn't turn into a hundred notifications. */
export const MAX_RECEIPTS_PER_DAY = 50
/** OAuth clients that registered without a name get this one (app/oauth/register). */
const GENERIC_CLIENT_NAMES = new Set(["ai assistant"])
const MAX_NAME_LENGTH = 80

function clip(text: string, max = MAX_NAME_LENGTH): string {
  const trimmed = text.trim()
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** Ledger key. The completedAt makes a re-log after Undo a new receipt; a repeat of the same log is not. */
export function receiptKey(item: AssistantLogItem): string {
  const at = Date.parse(item.completedAt) || 0
  return item.type === "habit" ? `log:habit:${item.habitId}:${item.date}:${at}` : `log:todo:${item.todoId}:${at}`
}

/** One tag per item: each receipt keeps its own Undo, and a later "Undone" replaces exactly it. */
export function receiptTag(item: AssistantLogItem): string {
  return item.type === "habit" ? `log-habit-${item.habitId}-${item.date}` : `log-todo-${item.todoId}`
}

function formatDay(date: string, locale: Locale): string {
  const [y, m, d] = date.split("-").map(Number)
  return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, m - 1, d)))
}

export interface ReceiptMessage {
  title: string
  body: string
  tag: string
  url: string
  undoLabel: string
  undone: { title: string; body: string }
  undoFailed: { title: string; body: string }
}

/** Pure: the receipt's text. `completions` (completed, about a week back) is only read for habits. */
export function receiptMessage({
  item,
  assistant,
  data,
  completions,
  today,
  locale,
}: {
  item: AssistantLogItem
  assistant: string | null
  data: Pick<StorageData, "habits" | "todos" | "preferences">
  completions: HabitCompletion[]
  today: string
  locale: Locale
}): ReceiptMessage {
  const t = translations[locale].habits.app.assistantReceipts
  const named = assistant?.trim() ?? ""
  const who = named && !GENERIC_CLIENT_NAMES.has(named.toLowerCase()) ? clip(named, 40) : t.assistant
  const name = clip(item.name)

  if (item.type === "habit") {
    let body: string
    if (item.date !== today) {
      body = formatMessage(t.pastDay, { date: formatDay(item.date, locale) })
    } else {
      const { done, total } = todayProgress(data, completions, today)
      body = total > 0 && done >= total ? t.allHabitsDone : plural(t.habitsProgress, total, { done })
    }
    return {
      title: formatMessage(t.habitTitle, { assistant: who, name }),
      body,
      tag: receiptTag(item),
      url: "/tracker?view=habits",
      undoLabel: t.undo,
      undone: { title: formatMessage(t.undoneTitle, { name }), body: t.undoneHabitBody },
      undoFailed: { title: t.undoFailedTitle, body: t.undoFailedBody },
    }
  }

  const left = openTodosDueBy(data, today).length
  return {
    title: formatMessage(t.todoTitle, { assistant: who, name }),
    body: left > 0 ? plural(t.todosLeft, left) : t.noTodosLeft,
    tag: receiptTag(item),
    url: "/tracker?view=todos",
    undoLabel: t.undo,
    undone: { title: formatMessage(t.undoneTitle, { name }), body: t.undoneTodoBody },
    undoFailed: { title: t.undoFailedTitle, body: t.undoFailedBody },
  }
}

async function recentCompletions(sql: Sql, userId: number, data: StorageData, today: string): Promise<HabitCompletion[]> {
  const since = addDays(today, -8)
  const rows = await getCompletionRows(sql, userId, since)
  if (rows.length) return rows
  return (data.completions ?? []).filter((c) => c?.completed && c.date >= since)
}

function undoActionFor(item: AssistantLogItem, message: ReceiptMessage): PushAction {
  const notice = { tag: message.tag, title: message.undone.title, body: message.undone.body, url: message.url }
  return item.type === "habit"
    ? { kind: "undo-habit", habitId: item.habitId, date: item.date, completedAt: item.completedAt, previous: item.previous, notice }
    : { kind: "undo-todo", todoId: item.todoId, completedAt: item.completedAt, previous: item.previous, notice }
}

/** Sends the receipt if the user wants it and has a device. Exported for tests; handlers use queueAssistantReceipt. */
export async function notifyAssistantLog(input: AssistantLogInput, sql: Sql = getDb()): Promise<ReceiptOutcome> {
  if (!pushConfigured()) return "push_not_configured"
  await ensurePushTables()
  const { userId, item } = input

  // Re-read: the handler's copy predates the write it just made.
  const rows = await sql`SELECT data FROM habit_users WHERE id = ${userId}`
  const data = (rows[0]?.data ?? {}) as StorageData
  const prefs = data.preferences ?? {}
  if (prefs.notifications === false || prefs.assistantLogPush === false) return "off"
  if (!(await hasPushDevice(sql, userId))) return "no_device"

  const sentToday = await countSentToday(userId, "log:", localDayStartUtc(prefs.timeZone), sql)
  if (sentToday >= MAX_RECEIPTS_PER_DAY) return "daily_cap"
  if (!(await claimNotification(userId, receiptKey(item), `log:${item.type}`, "push", sql))) return "duplicate"

  const assistant = input.connectionId ? await connectionName(input.connectionId).catch(() => null) : null
  const completions = item.type === "habit" ? await recentCompletions(sql, userId, data, input.today) : []
  const message = receiptMessage({ item, assistant, data, completions, today: input.today, locale: coachLocale(data) })

  const token = await createPushAction(sql, userId, undoActionFor(item, message))
  const result = await sendPush(userId, {
    title: message.title,
    body: message.body,
    tag: message.tag,
    url: message.url,
    actions: [{ action: "undo", title: message.undoLabel }],
    data: {
      actionToken: token,
      undoneTitle: message.undone.title,
      undoneBody: message.undone.body,
      undoFailedTitle: message.undoFailed.title,
      undoFailedBody: message.undoFailed.body,
    },
  })
  if (result.sent === 0) {
    await deletePushAction(sql, token)
    return "not_delivered"
  }
  return "sent"
}

/** Fire-and-forget from a write handler: runs after the response, never throws. */
export function queueAssistantReceipt(input: AssistantLogInput): void {
  runAfterResponse("receipts", () => notifyAssistantLog(input))
}
