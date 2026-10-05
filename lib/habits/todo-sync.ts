import type { StorageData, Todo } from "./types"

export type TodoTombstones = NonNullable<StorageData["todoTombstones"]>

type TimestampedTodo = Pick<Todo, "id" | "createdAt"> & Partial<Pick<Todo, "completedAt" | "updatedAt">>

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

export function getTodoSyncTimestamp(todo: TimestampedTodo): string {
  return [todo.createdAt, todo.completedAt, todo.updatedAt]
    .filter(isTimestamp)
    .reduce((latest, timestamp) => (timestamp > latest ? timestamp : latest), "")
}

export function mergeTodoTombstones(
  clientTombstones?: TodoTombstones,
  serverTombstones?: TodoTombstones,
): TodoTombstones {
  const merged: TodoTombstones = {}

  for (const tombstones of [clientTombstones, serverTombstones]) {
    for (const [id, deletedAt] of Object.entries(tombstones ?? {})) {
      if (!isTimestamp(deletedAt)) continue
      if (!merged[id] || deletedAt > merged[id]) {
        merged[id] = deletedAt
      }
    }
  }

  return merged
}

interface MergeTodosOptions {
  clientTodos?: StorageData["todos"]
  serverTodos?: StorageData["todos"]
  clientLastUpdated?: string
  clientTombstones?: TodoTombstones
  serverTombstones?: TodoTombstones
}

export interface MergeTodosResult {
  todos: StorageData["todos"]
  todoTombstones: TodoTombstones
}

function wasDeletedAfterClientSync(deletedAt: string | undefined, clientLastUpdated: string | undefined): boolean {
  return isTimestamp(deletedAt) && (!isTimestamp(clientLastUpdated) || deletedAt > clientLastUpdated)
}

function tombstoneWins(todo: TimestampedTodo, tombstones: TodoTombstones): boolean {
  const deletedAt = tombstones[todo.id]
  return isTimestamp(deletedAt) && deletedAt >= getTodoSyncTimestamp(todo)
}

export function mergeTodos({
  clientTodos,
  serverTodos,
  clientLastUpdated,
  clientTombstones,
  serverTombstones,
}: MergeTodosOptions): MergeTodosResult {
  const todoTombstones = mergeTodoTombstones(clientTombstones, serverTombstones)
  const merged = new Map<string, Todo>()

  for (const todo of clientTodos ?? []) {
    const deletedAt = todoTombstones[todo.id]

    if (wasDeletedAfterClientSync(deletedAt, clientLastUpdated) || tombstoneWins(todo, todoTombstones)) {
      continue
    }

    const existing = merged.get(todo.id)
    if (!existing || getTodoSyncTimestamp(todo) > getTodoSyncTimestamp(existing)) {
      merged.set(todo.id, todo)
    }
  }

  for (const todo of serverTodos ?? []) {
    const serverTime = getTodoSyncTimestamp(todo)

    if (tombstoneWins(todo, todoTombstones)) {
      merged.delete(todo.id)
      continue
    }

    const existing = merged.get(todo.id)

    if (!existing) {
      if (!isTimestamp(clientLastUpdated) || serverTime > clientLastUpdated) {
        merged.set(todo.id, todo)
      }
      continue
    }

    if (serverTime > getTodoSyncTimestamp(existing)) {
      merged.set(todo.id, todo)
    }
  }

  return {
    todos: Array.from(merged.values()),
    todoTombstones,
  }
}
