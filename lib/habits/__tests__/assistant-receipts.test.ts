import { beforeEach, describe, expect, it, vi } from "vitest"
import type { HabitCompletion, StorageData, Todo } from "@/lib/habits/types"
// vi.mock calls below are hoisted above these imports by vitest.
import { MAX_RECEIPTS_PER_DAY, notifyAssistantLog, receiptKey, receiptMessage, type AssistantLogItem } from "@/lib/habits/assistant-receipts"
import { formatMessage } from "@/lib/i18n-format"
import { translations } from "@/lib/translations"

/**
 * The receipt pushed when an assistant logs something: its text (pure) and
 * when it is sent, with push, the ledger and storage in memory.
 */

const state = vi.hoisted(() => ({
  configured: true,
  devices: 1,
  sentToday: 0,
  claimed: new Set<string>(),
  claims: [] as { key: string; kind: string; channel: string }[],
  data: {} as Record<string, unknown>,
  completions: [] as HabitCompletion[],
  delivered: 1,
  pushes: [] as Record<string, unknown>[],
  actions: [] as Record<string, unknown>[],
  deleted: [] as string[],
}))

vi.mock("@/lib/habits/push", () => ({
  pushConfigured: () => state.configured,
  ensurePushTables: async () => {},
  hasPushDevice: async () => state.devices > 0,
  countSentToday: async () => state.sentToday,
  localDayStartUtc: () => new Date("2026-10-20T00:00:00Z"),
  claimNotification: async (_userId: number, key: string, kind: string, channel: string) => {
    state.claims.push({ key, kind, channel })
    if (state.claimed.has(key)) return false
    state.claimed.add(key)
    return true
  },
  sendPush: async (_userId: number, payload: Record<string, unknown>) => {
    state.pushes.push(payload)
    return { sent: state.delivered, failed: 0, removed: 0 }
  },
}))

vi.mock("@/lib/habits/push-actions", () => ({
  createPushAction: async (_sql: unknown, _userId: number, action: Record<string, unknown>) => {
    state.actions.push(action)
    return "T".repeat(43)
  },
  deletePushAction: async (_sql: unknown, token: string) => {
    state.deleted.push(token)
  },
}))

vi.mock("@/lib/habits/oauth/store", () => ({ connectionName: async () => "Claude" }))
vi.mock("@/lib/habits/optimized-storage", () => ({ getCompletionRows: async () => state.completions }))
vi.mock("@/lib/habits/db", () => ({ getDb: () => async () => [{ data: state.data }] }))

const TODAY = "2026-10-20"
const sql = (async () => [{ data: state.data }]) as unknown as Parameters<typeof notifyAssistantLog>[1]

const habit = (id: string, name: string) => ({ id, name, time: "", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-01-01T00:00:00.000Z" })
const done = (habitId: string, date = TODAY): HabitCompletion => ({ habitId, date, completed: true, completedAt: `${date}T10:00:00.000Z` })
const baseData = (extra: Partial<StorageData> = {}) =>
  ({
    habits: [habit("h1", "Meditation"), habit("h2", "Run"), habit("h3", "Read")],
    todos: [],
    preferences: {},
    ...extra,
  }) as unknown as StorageData

const habitItem = (overrides: Partial<Extract<AssistantLogItem, { type: "habit" }>> = {}): AssistantLogItem => ({
  type: "habit",
  habitId: "h1",
  name: "Meditation",
  date: TODAY,
  completedAt: `${TODAY}T10:00:00.000Z`,
  previous: null,
  ...overrides,
})

beforeEach(() => {
  Object.assign(state, { configured: true, devices: 1, sentToday: 0, delivered: 1 })
  state.claimed.clear()
  state.claims.length = 0
  state.pushes.length = 0
  state.actions.length = 0
  state.deleted.length = 0
  state.data = baseData() as unknown as Record<string, unknown>
  state.completions = [done("h1")]
})

describe("receiptMessage", () => {
  const en = translations.en.habits.app.assistantReceipts
  const es = translations.es.habits.app.assistantReceipts

  it("names the assistant and counts today's habits", () => {
    const message = receiptMessage({ item: habitItem(), assistant: "Claude", data: baseData(), completions: [done("h1")], today: TODAY, locale: "en" })
    expect(message.title).toBe(formatMessage(en.habitTitle, { assistant: "Claude", name: "Meditation" }))
    expect(message.body).toBe("1 of 3 habits done today.")
    expect(message.tag).toBe(`log-habit-h1-${TODAY}`)
    expect(message.url).toBe("/tracker?view=habits")
    expect(message.undoLabel).toBe("Undo")
    expect(message.undone.title).toBe("Undone: Meditation")
  })

  it("says all done when nothing is left", () => {
    const completions = ["h1", "h2", "h3"].map((id) => done(id))
    const message = receiptMessage({ item: habitItem(), assistant: "ChatGPT", data: baseData(), completions, today: TODAY, locale: "en" })
    expect(message.body).toBe(en.allHabitsDone)
  })

  it("falls back to a generic name for unnamed clients and missing connections", () => {
    for (const assistant of [null, "AI assistant", "  "]) {
      const message = receiptMessage({ item: habitItem(), assistant, data: baseData(), completions: [], today: TODAY, locale: "en" })
      expect(message.title).toBe(formatMessage(en.habitTitle, { assistant: en.assistant, name: "Meditation" }))
    }
  })

  it("dates a log for another day instead of counting today", () => {
    const item = habitItem({ date: "2026-10-18" })
    const message = receiptMessage({ item, assistant: "Claude", data: baseData(), completions: [], today: TODAY, locale: "en" })
    expect(message.body).toMatch(/^Saved for Sun, Oct 18\.$/)
    expect(message.tag).toBe("log-habit-h1-2026-10-18")
  })

  it("speaks Spanish when the user does", () => {
    const message = receiptMessage({ item: habitItem(), assistant: null, data: baseData(), completions: [done("h1")], today: TODAY, locale: "es" })
    expect(message.title).toBe("Tu asistente registró Meditation")
    expect(message.body).toBe("1 de 3 hábitos hechos hoy.")
    expect(message.undoLabel).toBe(es.undo)
  })

  it("counts the todos still open today", () => {
    const todos = [
      { id: "t2", title: "Pay rent", status: "incomplete", priority: 3, dueDate: TODAY },
      { id: "t3", title: "Later", status: "incomplete", priority: 3, dueDate: "2026-12-01" },
    ] as Todo[]
    const item: AssistantLogItem = { type: "todo", todoId: "t1", name: "Call the bank", completedAt: `${TODAY}T10:00:00.000Z`, previous: { status: "incomplete" } }
    const message = receiptMessage({ item, assistant: "Claude", data: baseData({ todos }), completions: [], today: TODAY, locale: "en" })
    expect(message.title).toBe("Claude completed Call the bank")
    expect(message.body).toBe("1 todo left for today.")
    expect(message.url).toBe("/tracker?view=todos")
    const none = receiptMessage({ item, assistant: "Claude", data: baseData(), completions: [], today: TODAY, locale: "en" })
    expect(none.body).toBe(translations.en.habits.app.assistantReceipts.noTodosLeft)
  })
})

describe("notifyAssistantLog", () => {
  const input = (item: AssistantLogItem = habitItem()) => ({ userId: 1, connectionId: "conn-1", today: TODAY, item })

  it("sends a receipt with Undo and the texts the service worker needs", async () => {
    expect(await notifyAssistantLog(input(), sql)).toBe("sent")
    expect(state.claims).toEqual([{ key: receiptKey(habitItem()), kind: "log:habit", channel: "push" }])
    expect(state.pushes).toHaveLength(1)
    const push = state.pushes[0] as { title: string; body: string; actions: { action: string }[]; data: Record<string, string> }
    expect(push.title).toBe("Claude logged Meditation")
    expect(push.body).toBe("1 of 3 habits done today.")
    expect(push.actions).toEqual([{ action: "undo", title: "Undo" }])
    expect(push.data.actionToken).toHaveLength(43)
    expect(push.data.undoneTitle).toBe("Undone: Meditation")
    expect(push.data.undoFailedTitle).toBe("Couldn't undo")
    expect(state.actions[0]).toMatchObject({ kind: "undo-habit", habitId: "h1", date: TODAY, previous: null, notice: { tag: `log-habit-h1-${TODAY}` } })
  })

  it("respects the switches", async () => {
    state.data = baseData({ preferences: { assistantLogPush: false } }) as unknown as Record<string, unknown>
    expect(await notifyAssistantLog(input(), sql)).toBe("off")
    state.data = baseData({ preferences: { notifications: false } }) as unknown as Record<string, unknown>
    expect(await notifyAssistantLog(input(), sql)).toBe("off")
    expect(state.claims).toHaveLength(0)
    expect(state.pushes).toHaveLength(0)
  })

  it("skips without push, a device or room under the daily cap", async () => {
    state.configured = false
    expect(await notifyAssistantLog(input(), sql)).toBe("push_not_configured")
    state.configured = true
    state.devices = 0
    expect(await notifyAssistantLog(input(), sql)).toBe("no_device")
    state.devices = 1
    state.sentToday = MAX_RECEIPTS_PER_DAY
    expect(await notifyAssistantLog(input(), sql)).toBe("daily_cap")
    expect(state.pushes).toHaveLength(0)
  })

  it("sends once per log, again after a re-log", async () => {
    expect(await notifyAssistantLog(input(), sql)).toBe("sent")
    expect(await notifyAssistantLog(input(), sql)).toBe("duplicate")
    expect(await notifyAssistantLog(input(habitItem({ completedAt: `${TODAY}T11:00:00.000Z` })), sql)).toBe("sent")
    expect(state.pushes).toHaveLength(2)
  })

  it("drops the token when no device took the push", async () => {
    state.delivered = 0
    expect(await notifyAssistantLog(input(), sql)).toBe("not_delivered")
    expect(state.deleted).toEqual(["T".repeat(43)])
  })
})
