import { randomBytes } from "node:crypto"

import type { getDb } from "@/lib/habits/db"
import { sha256Hex } from "@/lib/habits/oauth/pkce"
import {
  deleteCompletionRow,
  getCompletionRow,
  getTodoRow,
  refreshStorageJsonFromOptimizedTables,
  upsertCompletionRow,
  upsertTodoRow,
} from "@/lib/habits/optimized-storage"
import type { HabitCompletion, Todo } from "@/lib/habits/types"

/**
 * Single-use tokens behind notification buttons. The service worker has no
 * session, so a button carries a random token instead; the server keeps only
 * its SHA-256 (habit_push_actions) with the one change it may revert. A
 * leaked token can at worst undo that one log within a day.
 */

type Sql = ReturnType<typeof getDb>

/**
 * Undo exactly what an assistant just did; `previous` is the state to put
 * back. `notice` is the already-translated "Undone" notification that
 * replaces the receipt on the user's other devices.
 */
export type PushAction = (
  | { kind: "undo-habit"; habitId: string; date: string; completedAt: string; previous: HabitCompletion | null }
  | { kind: "undo-todo"; todoId: string; completedAt: string; previous: { status: Todo["status"]; completedAt?: string } }
) & { notice?: { tag: string; title: string; body: string; url: string } }

export const PUSH_ACTION_TTL_MS = 24 * 60 * 60 * 1000
/** 32 random bytes in base64url. */
export const PUSH_ACTION_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/

/** Stores the action and returns its token. Clears this user's expired tokens on the way. */
export async function createPushAction(
  sql: Sql,
  userId: number,
  action: PushAction,
  ttlMs: number = PUSH_ACTION_TTL_MS,
  now: Date = new Date(),
): Promise<string> {
  const token = randomBytes(32).toString("base64url")
  await sql`DELETE FROM habit_push_actions WHERE user_id = ${userId} AND expires_at < ${now}`
  await sql`
    INSERT INTO habit_push_actions (token_hash, user_id, action, expires_at)
    VALUES (${sha256Hex(token)}, ${userId}, ${JSON.stringify(action)}::jsonb, ${new Date(now.getTime() + ttlMs)})
  `
  return token
}

/** Drops a token nobody will be able to use (the push reached no device). */
export async function deletePushAction(sql: Sql, token: string): Promise<void> {
  await sql`DELETE FROM habit_push_actions WHERE token_hash = ${sha256Hex(token)}`
}

/**
 * Takes the token out of the table in one statement, so two devices tapping
 * Undo at once can't both use it. Null when unknown or already used.
 */
export async function consumePushAction(
  sql: Sql,
  token: string,
  now: Date = new Date(),
): Promise<{ userId: number; action: PushAction } | "expired" | null> {
  const rows = await sql`
    DELETE FROM habit_push_actions WHERE token_hash = ${sha256Hex(token)}
    RETURNING user_id, action, expires_at
  `
  const row = rows[0]
  if (!row) return null
  if (new Date(row.expires_at as string | Date).getTime() < now.getTime()) return "expired"
  return { userId: row.user_id as number, action: row.action as PushAction }
}

/**
 * Reverts the action if what it changed is still as the assistant left it
 * (same completedAt). Anything since — a tap in the app, another log —
 * wins, and the answer is "changed".
 */
export async function undoPushAction(
  sql: Sql,
  userId: number,
  action: PushAction,
  now: Date = new Date(),
): Promise<"undone" | "changed"> {
  const stamp = now.toISOString()

  if (action.kind === "undo-habit") {
    const current = await getCompletionRow(sql, userId, action.habitId, action.date)
    if (!current?.completed || current.completedAt !== action.completedAt) return "changed"
    if (action.previous) await upsertCompletionRow(sql, userId, action.previous)
    else await deleteCompletionRow(sql, userId, action.habitId, action.date)
    await refreshStorageJsonFromOptimizedTables(sql, userId, ["completions"], stamp)
    return "undone"
  }

  const current = await getTodoRow(sql, userId, action.todoId)
  if (!current || current.status !== "completed" || current.completedAt !== action.completedAt) return "changed"
  const { completedAt: _dropped, ...rest } = current
  const restored: Todo = {
    ...rest,
    status: action.previous.status,
    updatedAt: stamp,
    ...(action.previous.completedAt ? { completedAt: action.previous.completedAt } : {}),
  }
  await upsertTodoRow(sql, userId, restored)
  await refreshStorageJsonFromOptimizedTables(sql, userId, ["todos"], stamp)
  return "undone"
}
