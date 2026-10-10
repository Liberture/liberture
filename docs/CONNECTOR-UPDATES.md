# Connector updates: getting new tools to ChatGPT and Claude

ChatGPT and Claude load Liberture's MCP tool list (`tools/list`) when the connector is added or refreshed, and keep that copy. Tools published afterwards stay invisible until the user refreshes the connector by hand. The server can't push the change: it is stateless JSON with no session or stream, so `notifications/tools/list_changed` isn't available (see the Later item in `ROADMAP.md`).

So Liberture keeps track instead. It records which tool list each connection last loaded, and tells the user and the assistant when that list is behind.

User-facing guide: **/docs/updates** (`app/(site)/docs/updates/page.tsx`, strings in `docs.updates` in `lib/translations.ts`).

## What is stored

Table `habit_connector_syncs` (`lib/habits/api/connector-sync.ts`; Prisma model `HabitConnectorSync`). The app creates it on first use; on liberture.com the deploy's `prisma db push` creates it.

| Column | Meaning |
|---|---|
| `connection_key` | `conn:<habit_api_connections.id>` for an OAuth connector (`hta_` token), `script:<user id>` for the script token (`hti_`) |
| `user_id` | Owner; rows are deleted with the user and by Reset account |
| `tools_version` | `TOOLS_VERSION` the connection loaded: a hash of every tool's name and input schema (`lib/habits/api/operations.ts`) |
| `tool_names`, `tool_count` | The tools it saw, used to list what's new |
| `sync_count` | How many times it has loaded the list (the counter) |
| `first_synced_at`, `synced_at` | First and latest load |

A row is upserted on every MCP `tools/list` (`lib/habits/api/mcp-server.ts`), for both `/mcp` and `/api/mcp/<token>`. Nothing about conversations or tool calls is stored.

Custom GPT actions (OpenAPI) don't call `tools/list`, so they have no row. For those, the guide says to re-import `/api/v1/openapi.json`.

## Where it shows up

- **Settings → Assistants:** each connected app shows either "Tools up to date · loaded {date}" or "N new tools since {date} — How to refresh". Data comes from `GET /api/v1/connections`: `tools` per connection, plus `scriptTokenTools` and `server`.
- **`get_today`:** when the caller's list is behind, the header gets a line such as:
  > Your tool list is out of date (loaded 2026-10-05, version f3f3ff24; now 9a1b2c3d). 2 new tools since: get_agenda, update_event. Tell the user once to refresh the Liberture connector…

  The model can't refresh itself, so the line asks it to tell the user.
- **`get_permissions`:** `connector.yourSync` returns `{ syncedAt, version, syncCount, upToDate, newTools, removedTools }`, plus `refreshGuide`.
- **`/docs/updates`:** shows the server's current tool count and version.

## When it fires

A connection counts as behind when its stored `tools_version` differs from the server's. That happens when a tool is added or removed, or when a tool's input schema changes. Editing only a description doesn't change the version, so it doesn't trigger a refresh prompt. `newTools` lists the names the connection hasn't seen.

## Shipping new tools: checklist

1. Add the operation to `API_OPERATIONS` (and to `HANDLERS` in `mcp-tools.ts`). `TOOLS_VERSION` changes by itself.
2. Deploy. Every connection whose list is now behind gets the Settings note and the `get_today` line on the next call.
3. If a tool was removed or renamed, check `removedTools` in `get_permissions` before assuming old clients are fine. They will keep calling the old name until refreshed, and the server answers `Unknown tool`.
