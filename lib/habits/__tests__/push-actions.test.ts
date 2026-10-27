import { beforeEach, describe, expect, it, vi } from "vitest"
import type { HabitCompletion, Todo } from "@/lib/habits/types"
// vi.mock calls below are hoisted above these imports by vitest.
import { consumePushAction, createPushAction, undoPushAction, type PushAction } from "@/lib/habits/push-actions"
import { POST } from "@/app/api/habits/push/action/route"

/**
 * Notification-button tokens and the Undo they carry, with habit_push_actions
 * and the habit tables in memory.
 */

const db = vi.hoisted(() => ({
  actions: new Map<string, { user_id: number; action: unknown; expires_at: Date }>(),
  completions: new Map<string, HabitCompletion>(),
  todos: new Map<string, Todo>(),
  refreshed: [] as string[][],
  pushes: [] as Record<string, unknown>[],
}))

/** Just enough of postgres.js's tagged template for push-actions.ts. */
const fakeSql = vi.hoisted(() => async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const text = strings.join("?")
  if (text.includes("INSERT INTO habit_push_actions")) {
    const [hash, userId, action, expiresAt] = values as [string, number, string, Date]
    db.actions.set(hash, { user_id: userId, action: JSON.parse(action), expires_at: expiresAt })
    return []
  }
  if (text.includes("DELETE FROM habit_push_actions WHERE user_id")) {
    const [userId, now] = values as [number, Date]
    for (const [hash, row] of db.actions) if (row.user_id === userId && row.expires_at < now) db.actions.delete(hash)
    return []
  }
  if (text.includes("DELETE FROM habit_push_actions WHERE token_hash")) {
    const hash = values[0] as string
    const row = db.actions.get(hash)
    db.actions.delete(hash)
    return text.includes("RETURNING") && row ? [row] : []
  }
  return []
})

vi.mock("@/lib/habits/db", () => ({ getDb: () => fakeSql }))
vi.mock("@/lib/habits/push", () => ({
  ensurePushTables: async () => {},
  sendPush: async (_userId: number, payload: Record<string, unknown>) => {
    db.pushes.push(payload)
    return { sent: 1, failed: 0, removed: 0 }
  },
}))
vi.mock("@/lib/habits/optimized-storage", () => ({
  getCompletionRow: async (_sql: unknown, _userId: number, habitId: string, date: string) => db.completions.get(`${habitId}:${date}`) ?? null,
  upsertCompletionRow: async (_sql: unknown, _userId: number, completion: HabitCompletion) => {
    db.completions.set(`${completion.habitId}:${completion.date}`, completion)
  },
  deleteCompletionRow: async (_sql: unknown, _userId: number, habitId: string, date: string) => {
    db.completions.delete(`${habitId}:${date}`)
  },
  getTodoRow: async (_sql: unknown, _userId: number, id: string) => db.todos.get(id) ?? null,
  upsertTodoRow: async (_sql: unknown, _userId: number, todo: Todo) => {
    db.todos.set(todo.id, todo)
  },
  refreshStorageJsonFromOptimizedTables: async (_sql: unknown, _userId: number, sections: string[]) => {
    db.refreshed.push(sections)
  },
}))

const sql = fakeSql as unknown as Parameters<typeof createPushAction>[0]
const DAY = "2026-10-20"
const LOGGED_AT = `${DAY}T10:00:00.000Z`

const undoHabit = (previous: HabitCompletion | null = null): PushAction => ({
  kind: "undo-habit",
  habitId: "h1",
  date: DAY,
  completedAt: LOGGED_AT,
  previous,
  notice: { tag: `log-habit-h1-${DAY}`, title: "Undone: Pushups", body: "It's no longer marked done.", url: "/tracker?view=habits" },
})

let ip = 0
const tap = (token: unknown, action: unknown = "undo", from = `10.0.0.${++ip}`) =>
  POST(
    new Request("https://liberture.test/api/habits/push/action", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": from },
      body: JSON.stringify({ token, action }),
    }),
  )

beforeEach(() => {
  db.actions.clear()
  db.completions.clear()
  db.todos.clear()
  db.refreshed.length = 0
  db.pushes.length = 0
})

describe("tokens", () => {
  it("are random, stored only as a hash, and single-use", async () => {
    const token = await createPushAction(sql, 1, undoHabit())
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect([...db.actions.keys()]).not.toContain(token)
    expect(await consumePushAction(sql, token)).toMatchObject({ userId: 1, action: { kind: "undo-habit", habitId: "h1" } })
    expect(await consumePushAction(sql, token)).toBeNull()
  })

  it("expire, and expired ones are cleared on the next create", async () => {
    const issued = new Date("2026-10-20T10:00:00Z")
    const old = await createPushAction(sql, 1, undoHabit(), 60_000, issued)
    expect(await consumePushAction(sql, old, new Date("2026-10-20T10:02:00Z"))).toBe("expired")

    await createPushAction(sql, 1, undoHabit(), 60_000, issued)
    expect(db.actions.size).toBe(1)
    await createPushAction(sql, 1, undoHabit(), 60_000, new Date("2026-10-20T11:00:00Z"))
    expect(db.actions.size).toBe(1)
  })
})

describe("undoPushAction", () => {
  it("removes a completion that didn't exist before", async () => {
    db.completions.set(`h1:${DAY}`, { habitId: "h1", date: DAY, completed: true, completedAt: LOGGED_AT })
    expect(await undoPushAction(sql, 1, undoHabit())).toBe("undone")
    expect(db.completions.has(`h1:${DAY}`)).toBe(false)
    expect(db.refreshed).toEqual([["completions"]])
  })

  it("puts back the partial row the log completed", async () => {
    const partial: HabitCompletion = { habitId: "h1", date: DAY, completed: false, completedAt: `${DAY}T08:00:00.000Z`, data: { reps: 20 } }
    db.completions.set(`h1:${DAY}`, { ...partial, completed: true, completedAt: LOGGED_AT, data: { reps: 50 } })
    expect(await undoPushAction(sql, 1, undoHabit(partial))).toBe("undone")
    expect(db.completions.get(`h1:${DAY}`)).toEqual(partial)
  })

  it("leaves alone anything that changed since", async () => {
    db.completions.set(`h1:${DAY}`, { habitId: "h1", date: DAY, completed: true, completedAt: `${DAY}T12:00:00.000Z` })
    expect(await undoPushAction(sql, 1, undoHabit())).toBe("changed")
    db.completions.clear()
    expect(await undoPushAction(sql, 1, undoHabit())).toBe("changed")
    expect(db.refreshed).toHaveLength(0)
  })

  it("reopens a todo with its previous status", async () => {
    db.todos.set("t1", { id: "t1", title: "Call the bank", priority: 3, status: "completed", completedAt: LOGGED_AT, createdAt: "2026-10-01" } as Todo)
    const action: PushAction = { kind: "undo-todo", todoId: "t1", completedAt: LOGGED_AT, previous: { status: "in_progress" } }
    expect(await undoPushAction(sql, 1, action)).toBe("undone")
    const todo = db.todos.get("t1")!
    expect(todo.status).toBe("in_progress")
    expect("completedAt" in todo).toBe(false)
    expect(db.refreshed).toEqual([["todos"]])

    expect(await undoPushAction(sql, 1, action)).toBe("changed")
  })
})

describe("POST /api/habits/push/action", () => {
  it("undoes once and quietly replaces the receipt on other devices", async () => {
    db.completions.set(`h1:${DAY}`, { habitId: "h1", date: DAY, completed: true, completedAt: LOGGED_AT })
    const token = await createPushAction(sql, 1, undoHabit())

    const first = await tap(token)
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ ok: true, reason: "undone" })
    expect(first.headers.get("Cache-Control")).toBe("no-store")
    await vi.waitFor(() => expect(db.pushes).toHaveLength(1))
    expect(db.pushes[0]).toMatchObject({ title: "Undone: Pushups", tag: `log-habit-h1-${DAY}`, silent: true })

    const second = await tap(token)
    expect(second.status).toBe(404)
  })

  it("answers changed without pushing when the item moved on", async () => {
    const token = await createPushAction(sql, 1, undoHabit())
    const response = await tap(token)
    expect(await response.json()).toEqual({ ok: false, reason: "changed" })
    expect(db.pushes).toHaveLength(0)
  })

  it("rejects malformed bodies and unknown actions", async () => {
    expect((await tap("short")).status).toBe(400)
    expect((await tap(42)).status).toBe(400)
    expect((await tap("A".repeat(43), "delete")).status).toBe(400)
    expect((await tap("A".repeat(43))).status).toBe(404)
  })

  it("rate-limits one client", async () => {
    const from = "192.0.2.77"
    const statuses: number[] = []
    for (let i = 0; i < 31; i++) statuses.push((await tap("A".repeat(43), "undo", from)).status)
    expect(statuses.slice(0, 30).every((s) => s === 404)).toBe(true)
    expect(statuses[30]).toBe(429)
  })
})
