import { getDb } from "@/lib/habits/db"
import { MCP_TOOL_NAMES, TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"

/**
 * When each assistant connection last loaded Liberture's tool list.
 *
 * ChatGPT and Claude fetch `tools/list` once (when the connector is added or
 * refreshed) and keep that copy; tools published later stay invisible until
 * the user refreshes by hand. Recording the version each connection saw lets
 * us tell the user — and the assistant itself, in get_today — that new tools
 * are waiting. See docs/CONNECTOR-UPDATES.md.
 *
 * One row per connection: `conn:<id>` for an OAuth connector (hta_ token),
 * `script:<userId>` for the script token (hti_), which has no connection row.
 */

export interface ToolSync {
  key: string
  /** Version of the tool list the client loaded (TOOLS_VERSION at the time). */
  toolsVersion: string
  toolCount: number
  syncedAt: string
  firstSyncedAt: string
  /** How many times this connection has loaded the tool list. */
  syncCount: number
}

export interface ToolSyncStatus extends ToolSync {
  upToDate: boolean
  /** Tools published since this connection last loaded the list. */
  newTools: string[]
  /** Tools it still lists that no longer exist. */
  removedTools: string[]
}

let ready: Promise<void> | null = null

async function ensureTable(): Promise<void> {
  ready ??= (async () => {
    const sql = getDb()
    await sql`
      CREATE TABLE IF NOT EXISTS habit_connector_syncs (
        connection_key TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
        tools_version TEXT NOT NULL,
        tool_names TEXT[] NOT NULL DEFAULT '{}',
        tool_count INTEGER NOT NULL,
        sync_count INTEGER NOT NULL DEFAULT 1,
        first_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    await sql`CREATE INDEX IF NOT EXISTS idx_habit_connector_syncs_user ON habit_connector_syncs (user_id)`
  })().catch((error: unknown) => {
    ready = null
    throw error
  })
  return ready
}

export function connectionKeyFor(auth: { userId: number; connectionId?: string | null }): string {
  return auth.connectionId ? `conn:${auth.connectionId}` : `script:${auth.userId}`
}

/** Called on every MCP tools/list: this connection now has the current list. */
export async function recordToolSync(userId: number, key: string): Promise<void> {
  await ensureTable()
  const names = [...MCP_TOOL_NAMES]
  await getDb()`
    INSERT INTO habit_connector_syncs (connection_key, user_id, tools_version, tool_names, tool_count)
    VALUES (${key}, ${userId}, ${TOOLS_VERSION}, ${names}, ${TOOL_COUNT})
    ON CONFLICT (connection_key) DO UPDATE SET
      tools_version = EXCLUDED.tools_version,
      tool_names = EXCLUDED.tool_names,
      tool_count = EXCLUDED.tool_count,
      sync_count = habit_connector_syncs.sync_count + 1,
      synced_at = NOW()`
}

/** Pure: how a stored sync compares with the tools published now. */
export function compareSync(sync: ToolSync & { toolNames: string[] }, current: readonly string[] = MCP_TOOL_NAMES): ToolSyncStatus {
  const seen = new Set(sync.toolNames)
  const now = new Set(current)
  const newTools = current.filter((name) => !seen.has(name))
  const removedTools = sync.toolNames.filter((name) => !now.has(name))
  const { toolNames: _omit, ...rest } = sync
  void _omit
  return { ...rest, upToDate: sync.toolsVersion === TOOLS_VERSION && newTools.length === 0, newTools, removedTools }
}

function rowToSync(row: Record<string, unknown>): ToolSync & { toolNames: string[] } {
  const iso = (v: unknown) => new Date(v as string).toISOString()
  return {
    key: row.connection_key as string,
    toolsVersion: row.tools_version as string,
    toolNames: (row.tool_names as string[] | null) ?? [],
    toolCount: row.tool_count as number,
    syncCount: row.sync_count as number,
    firstSyncedAt: iso(row.first_synced_at),
    syncedAt: iso(row.synced_at),
  }
}

/** Every connection of a user, by key. Connections that never loaded the list are absent. */
export async function syncStatusesFor(userId: number): Promise<Map<string, ToolSyncStatus>> {
  await ensureTable()
  const rows = await getDb()`SELECT * FROM habit_connector_syncs WHERE user_id = ${userId}`
  return new Map(rows.map((row) => {
    const status = compareSync(rowToSync(row))
    return [status.key, status]
  }))
}

/** The caller's own connection, or null before its first tools/list. */
export async function syncStatusFor(key: string): Promise<ToolSyncStatus | null> {
  await ensureTable()
  const rows = await getDb()`SELECT * FROM habit_connector_syncs WHERE connection_key = ${key}`
  return rows.length ? compareSync(rowToSync(rows[0])) : null
}

/**
 * One line for get_today, or null when the assistant is current. Written for
 * the model: it can't refresh itself, so it should tell the user how.
 */
export function staleConnectorLine(status: ToolSyncStatus | null): string | null {
  if (!status || status.upToDate) return null
  const day = status.syncedAt.slice(0, 10)
  const added = status.newTools.length
    ? ` ${status.newTools.length} new tool${status.newTools.length === 1 ? "" : "s"} since: ${status.newTools.join(", ")}.`
    : ""
  return `Your tool list is out of date (loaded ${day}, version ${status.toolsVersion}; now ${TOOLS_VERSION}).${added} Tell the user once to refresh the Liberture connector in their assistant's settings (guide: /docs/updates).`
}
