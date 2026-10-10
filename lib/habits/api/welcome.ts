import { getDb } from "@/lib/habits/db"

/**
 * The first conversation with a newly connected assistant.
 *
 * After Approve the user lands in an empty ChatGPT/Claude chat; the assistant
 * knows nothing beyond the server instructions. So for a connection's first
 * conversations get_today carries WELCOME_GUIDE: present Liberture, ask a few
 * questions, offer catalog protocols. The assistant calls complete_welcome
 * when done (or when the user would rather skip), and we stop after
 * MAX_SHOWN notices anyway so it never nags.
 */

export const MAX_SHOWN = 3
/** A connection this new still gets the welcome even if the user already has habits. */
const NEW_CONNECTION_MS = 3 * 24 * 60 * 60 * 1000

/** Written for the model; it answers in the user's language. */
export const WELCOME_GUIDE =
  "FIRST CONVERSATION with this assistant: welcome the user before (or right after a quick answer to) whatever they asked. " +
  "1) In one or two sentences, say what you can do with Liberture: log habits by text or voice, today's plan and streaks, weekly stats, " +
  "todos and calendar, reminders, and a coach that checks in. " +
  "2) Ask up to three short questions, one at a time: which area they want to improve (work, sleep, nutrition, mind, exercise, finance), " +
  "when their day usually starts, and what they already do. " +
  "3) Call search_catalog with what they said and offer 2–3 protocols, each with its infoUrl. Add one with adopt_habit only when they say yes, " +
  "or create_habit for something of their own. " +
  "4) End with how to use it every day: \"what's left today?\", \"mark meditation done\". " +
  "Conversational, in their language, no lists of tool names. When done, or if they'd rather skip it, call complete_welcome."

let ready: Promise<void> | null = null

async function ensureTable(): Promise<void> {
  ready ??= (async () => {
    await getDb()`
      CREATE TABLE IF NOT EXISTS habit_assistant_welcomes (
        connection_key TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
        shown_count INTEGER NOT NULL DEFAULT 0,
        first_shown_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        outcome TEXT
      )`
  })().catch((error: unknown) => {
    ready = null
    throw error
  })
  return ready
}

/**
 * Pure: whether a connection still gets the welcome. Only OAuth connectors
 * (`conn:` keys) — the script token is for scripts, not chats — that are new
 * or whose user has nothing set up yet, until completed or shown MAX_SHOWN times.
 */
export function welcomeDue(input: {
  connectionKey: string
  connectionCreatedAt: Date | null
  activeHabits: number
  shownCount: number
  completed: boolean
  now?: Date
}): boolean {
  if (!input.connectionKey.startsWith("conn:")) return false
  if (input.completed || input.shownCount >= MAX_SHOWN) return false
  const now = input.now ?? new Date()
  const isNew = input.connectionCreatedAt !== null && now.getTime() - input.connectionCreatedAt.getTime() < NEW_CONNECTION_MS
  return isNew || input.activeHabits === 0
}

/**
 * For get_today: the welcome guide when this connection is due one (counting
 * the showing), else null. Never throws — a missing table or DB hiccup just
 * means no welcome.
 */
export async function welcomeNoticeFor(userId: number, connectionKey: string, activeHabits: number): Promise<string | null> {
  try {
    if (!connectionKey.startsWith("conn:")) return null
    await ensureTable()
    const sql = getDb()
    const id = connectionKey.slice("conn:".length)
    const [connection] = await sql`SELECT created_at FROM habit_api_connections WHERE id = ${id}`
    const [row] = await sql`SELECT shown_count, completed_at FROM habit_assistant_welcomes WHERE connection_key = ${connectionKey}`
    const due = welcomeDue({
      connectionKey,
      connectionCreatedAt: connection?.created_at ? new Date(connection.created_at as string) : null,
      activeHabits,
      shownCount: (row?.shown_count as number | undefined) ?? 0,
      completed: Boolean(row?.completed_at),
    })
    if (!due) return null
    await sql`
      INSERT INTO habit_assistant_welcomes (connection_key, user_id, shown_count)
      VALUES (${connectionKey}, ${userId}, 1)
      ON CONFLICT (connection_key) DO UPDATE SET shown_count = habit_assistant_welcomes.shown_count + 1`
    return WELCOME_GUIDE
  } catch {
    return null
  }
}

/** complete_welcome: the assistant ran the welcome, or the user skipped it. */
export async function completeWelcome(userId: number, connectionKey: string, outcome: "done" | "skipped"): Promise<void> {
  await ensureTable()
  await getDb()`
    INSERT INTO habit_assistant_welcomes (connection_key, user_id, shown_count, completed_at, outcome)
    VALUES (${connectionKey}, ${userId}, 0, NOW(), ${outcome})
    ON CONFLICT (connection_key) DO UPDATE SET completed_at = NOW(), outcome = EXCLUDED.outcome`
}
