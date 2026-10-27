import { beforeEach, describe, expect, it, vi } from "vitest"
import type { HabitCompletion, StorageData, Todo } from "@/lib/habits/types"
// vi.mock calls below are hoisted above these imports by vitest.
import { callMcpTool } from "@/lib/habits/api/mcp-tools"
import { queueAssistantReceipt } from "@/lib/habits/assistant-receipts"
import { runAfterResponse } from "@/lib/habits/after-response"

/**
 * Which assistant writes queue a receipt: real MCP tool calls through the
 * real /api/v1 handlers, with auth, storage and the receipt itself replaced
 * in memory. Only a change to done may queue one, and only once.
 */

const state = vi.hoisted(() => ({
  data: {} as StorageData,
  completions: new Map<string, HabitCompletion>(),
  todos: new Map<string, Todo>(),
}))

vi.mock("@/lib/habits/integration-auth", () => {
  const user = () => ({ userId: 1, apiKey: null, nostrPubkey: null, connectionId: "conn-1", data: state.data })
  return {
    authorizeIntegration: async () => user(),
    verifyIntegrationTokenValue: async () => user(),
    verifyIntegrationToken: async () => user(),
  }
})

vi.mock("@/lib/habits/db", () => ({ getDb: () => ({}) }))

vi.mock("@/lib/habits/optimized-storage", () => ({
  syncOptimizedStorageTablesIfEmpty: async () => {},
  refreshStorageJsonFromOptimizedTables: async () => {},
  getCompletionRow: async (_sql: unknown, _userId: number, habitId: string, date: string) => state.completions.get(`${habitId}:${date}`) ?? null,
  getCompletionRows: async () => [...state.completions.values()].filter((c) => c.completed),
  upsertCompletionRow: async (_sql: unknown, _userId: number, completion: HabitCompletion) => {
    state.completions.set(`${completion.habitId}:${completion.date}`, completion)
  },
  deleteCompletionRow: async (_sql: unknown, _userId: number, habitId: string, date: string) => {
    state.completions.delete(`${habitId}:${date}`)
  },
  getTodoRow: async (_sql: unknown, _userId: number, id: string) => state.todos.get(id) ?? null,
  upsertTodoRow: async (_sql: unknown, _userId: number, todo: Todo) => {
    state.todos.set(todo.id, todo)
  },
}))

vi.mock("@/lib/habits/assistant-receipts", () => ({ queueAssistantReceipt: vi.fn() }))

const queued = vi.mocked(queueAssistantReceipt)
const ORIGIN = "https://liberture.test"
const DAY = "2026-10-20"

const call = (name: string, args: Record<string, unknown>) => callMcpTool(name, { date: DAY, ...args }, "hta_test", ORIGIN)

beforeEach(() => {
  queued.mockClear()
  state.completions.clear()
  state.todos.clear()
  const todo: Todo = {
    id: "t1",
    title: "Call the bank",
    priority: 3,
    status: "incomplete",
    createdAt: "2026-10-01T00:00:00.000Z",
  } as Todo
  state.todos.set(todo.id, todo)
  state.data = {
    habits: [
      { id: "h1", name: "Meditation", time: "", color: "#fff", schedule: { type: "daily" }, createdAt: "2026-01-01T00:00:00.000Z" },
      {
        id: "h2",
        name: "Pushups",
        time: "",
        color: "#fff",
        schedule: { type: "daily" },
        createdAt: "2026-01-01T00:00:00.000Z",
        dataEntry: { enabled: true, fields: [{ id: "reps", label: "Reps", type: "number", unit: "pushups", goalValue: 50 }] },
      },
    ],
    completions: [],
    todos: [todo],
    projects: [],
    calendarEvents: [],
    lastUpdated: "2026-10-01T00:00:00.000Z",
  } as unknown as StorageData
})

describe("log_habit", () => {
  it("queues one receipt for the change to done, with no previous row", async () => {
    await call("log_habit", { habit: "Meditation" })
    expect(queued).toHaveBeenCalledTimes(1)
    const input = queued.mock.calls[0][0]
    expect(input).toMatchObject({ userId: 1, connectionId: "conn-1", item: { type: "habit", habitId: "h1", name: "Meditation", date: DAY, previous: null } })
    expect(input.item.completedAt).toBe(state.completions.get(`h1:${DAY}`)?.completedAt)
  })

  it("queues nothing when it was already done", async () => {
    await call("log_habit", { habit: "Meditation" })
    queued.mockClear()
    await call("log_habit", { habit: "Meditation" })
    await call("log_habit", { habit: "Meditation", note: "felt calm" })
    expect(queued).not.toHaveBeenCalled()
  })

  it("queues nothing when unmarking", async () => {
    await call("log_habit", { habit: "Meditation" })
    queued.mockClear()
    await call("log_habit", { habit: "Meditation", completed: false })
    expect(queued).not.toHaveBeenCalled()
    expect(state.completions.has(`h1:${DAY}`)).toBe(false)
  })
})

describe("log_habit_value", () => {
  it("queues only when the goal is reached, keeping the partial row as previous", async () => {
    await call("log_habit_value", { habit: "Pushups", value: 20 })
    expect(queued).not.toHaveBeenCalled()
    const partial = state.completions.get(`h2:${DAY}`)
    expect(partial?.completed).toBe(false)

    await call("log_habit_value", { habit: "Pushups", value: 30 })
    expect(queued).toHaveBeenCalledTimes(1)
    expect(queued.mock.calls[0][0].item).toMatchObject({ type: "habit", habitId: "h2", previous: partial })

    queued.mockClear()
    await call("log_habit_value", { habit: "Pushups", value: 10 })
    expect(queued).not.toHaveBeenCalled()
  })
})

describe("set_todo_status", () => {
  it("queues on the change to completed, with the previous status", async () => {
    await call("set_todo_status", { todo: "the bank call", status: "completed" })
    expect(queued).toHaveBeenCalledTimes(1)
    expect(queued.mock.calls[0][0].item).toMatchObject({ type: "todo", todoId: "t1", name: "Call the bank", previous: { status: "incomplete" } })
    expect(queued.mock.calls[0][0].item.completedAt).toBe(state.todos.get("t1")?.completedAt)
  })

  it("queues nothing for in progress", async () => {
    await call("set_todo_status", { todo: "Call the bank", status: "in_progress" })
    expect(queued).not.toHaveBeenCalled()
  })
})

describe("runAfterResponse", () => {
  it("runs the task right away outside a request and swallows its failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const task = vi.fn(async () => {
      throw new Error("push service down")
    })
    expect(() => runAfterResponse("test", task)).not.toThrow()
    await vi.waitFor(() => expect(warn).toHaveBeenCalledWith("[test]", "push service down"))
    expect(task).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
