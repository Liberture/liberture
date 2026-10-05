import { getDb } from "@/lib/habits/db"

/**
 * Live "your data changed" notifications for open trackers.
 *
 * Every writer (the tracker's own saves, the assistant API / MCP tools, other
 * devices, scripts) ends by bumping `habit_users.data.lastUpdated`. A trigger
 * turns that into a Postgres NOTIFY, one LISTEN connection per server process
 * fans it out to the SSE streams of that user's open tabs, and the tracker
 * reloads as soon as the event lands. Using the database as the bus means it
 * works whichever process or instance handled the write.
 */

export const CHANGE_CHANNEL = "habit_changes"

export interface ChangeEvent {
  userId: number
  lastUpdated: string | null
}

type Listener = (event: ChangeEvent) => void

let triggerReady: Promise<void> | null = null

/** Installs the notify trigger once per process. Idempotent and safe to race. */
export function ensureChangeTrigger(): Promise<void> {
  triggerReady ??= (async () => {
    const sql = getDb()
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION habit_users_notify_change() RETURNS trigger AS $$
      BEGIN
        IF NEW.data->>'lastUpdated' IS DISTINCT FROM OLD.data->>'lastUpdated' THEN
          PERFORM pg_notify(
            '${CHANGE_CHANNEL}',
            json_build_object('userId', NEW.id, 'lastUpdated', NEW.data->>'lastUpdated')::text
          );
        END IF;
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql
    `)
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'habit_users_notify_change') THEN
          CREATE TRIGGER habit_users_notify_change
            AFTER UPDATE ON habit_users
            FOR EACH ROW EXECUTE FUNCTION habit_users_notify_change();
        END IF;
      END
      $$
    `)
  })().catch((error: unknown) => {
    triggerReady = null
    throw error
  })
  return triggerReady
}

const listeners = new Map<number, Set<Listener>>()
let listening: Promise<void> | null = null

function startListening(): Promise<void> {
  listening ??= (async () => {
    await ensureChangeTrigger()
    // postgres.js keeps a dedicated connection for LISTEN and re-subscribes
    // after reconnects on its own.
    await getDb().listen(CHANGE_CHANNEL, (payload) => {
      let event: ChangeEvent
      try {
        event = JSON.parse(payload) as ChangeEvent
      } catch {
        return
      }
      for (const listener of listeners.get(event.userId) ?? []) listener(event)
    })
  })().catch((error: unknown) => {
    listening = null
    throw error
  })
  return listening
}

/** Calls `listener` whenever this user's data changes. Returns the unsubscribe. */
export async function subscribeToChanges(userId: number, listener: Listener): Promise<() => void> {
  await startListening()
  const set = listeners.get(userId) ?? new Set<Listener>()
  listeners.set(userId, set)
  set.add(listener)
  return () => {
    set.delete(listener)
    if (set.size === 0) listeners.delete(userId)
  }
}
