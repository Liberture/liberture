import type { ApiScope } from "@/lib/habits/api-scopes"

/**
 * The assistant-facing surface, described once.
 *
 * Three things are generated from this list and must not drift apart:
 *   - GET /api/v1/openapi.json  (ChatGPT Custom GPT actions)
 *   - the tools of /api/mcp/<token>  (Claude custom connector)
 *   - the reference table on /docs/api
 *
 * Kept small on purpose. A Custom GPT allows 30 operations, and every extra
 * tool is one more thing a voice assistant can pick wrongly. The rest of
 * /api/v1 still works for scripts; see API.md.
 */

export interface JsonSchema {
  type?: "string" | "number" | "integer" | "boolean" | "object" | "array"
  description?: string
  enum?: readonly string[]
  properties?: Record<string, JsonSchema>
  required?: readonly string[]
  items?: JsonSchema
  minimum?: number
  maximum?: number
  additionalProperties?: boolean | JsonSchema
}

export interface ApiParam {
  name: string
  in: "query" | "path"
  required?: boolean
  description: string
  schema: JsonSchema
}

export interface ApiOperation {
  /** OpenAPI operationId and MCP tool name. */
  id: string
  method: "GET" | "POST" | "PATCH"
  /** Path under /api/v1, with {param} placeholders. */
  path: string
  scope: ApiScope
  /** Short, for the docs table. */
  summary: string
  /** Written for the model: when to call it and what to do with the result. */
  description: string
  params?: ApiParam[]
  body?: JsonSchema
  /** Returns text/markdown instead of JSON. */
  markdown?: boolean
}

const TZ_PARAM: ApiParam = {
  name: "tz",
  in: "query",
  description: "The user's IANA time zone, e.g. America/Argentina/Buenos_Aires. Decides what 'today' means.",
  schema: { type: "string" },
}

export const API_OPERATIONS: readonly ApiOperation[] = [
  {
    id: "get_today",
    method: "GET",
    path: "/summary",
    scope: "read",
    summary: "Start here: the date, the user, today's habits and urgent todos",
    description:
      "The only call needed to start a conversation. Short markdown: today's date and weekday, the user's name, any actions they switched off, habits still to do and done (with streaks), notable streaks, overdue and due-today todos. Call it once, then act directly — the write tools take names, so don't list habits or todos first.",
    params: [TZ_PARAM],
    markdown: true,
  },
  {
    id: "log_habit",
    method: "POST",
    path: "/completions/toggle",
    scope: "log_completions",
    summary: "Mark a habit done (or undo it), by name",
    description:
      "Marks a habit done for today, or for `date`. Pass the habit as the user said it (\"walk\", \"meditación\"); it's matched for you, no lookup needed. completed: false undoes. Read back the `say` field. On 409 ask which of `options`; on 404 offer create_habit.",
    body: {
      type: "object",
      required: ["habit"],
      properties: {
        habit: { type: "string", description: "The habit's name as the user said it, or its id." },
        completed: { type: "boolean", description: "true = done (default), false = undo." },
        date: { type: "string", description: "YYYY-MM-DD. Omit for today." },
        timeZone: { type: "string", description: "IANA time zone, used when date is omitted." },
      },
    },
  },
  {
    id: "create_habit",
    method: "POST",
    path: "/habits",
    scope: "add_habits",
    summary: "Create any habit, e.g. running",
    description:
      "Creates a habit that isn't in the catalog. Only name is required: it defaults to every day with no reminder, so don't ask follow-up questions — create it, read back `say`, and let the user change it. days takes names ([\"mon\",\"thu\"], \"weekdays\", \"weekends\"); time HH:MM sets a reminder.",
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "What the habit is, e.g. \"Running\"." },
        description: { type: "string", description: "Optional: why it matters or what counts as done, in the user's words." },
        days: {
          type: "array",
          items: { type: "string" },
          description: "Days to do it, e.g. [\"mon\",\"wed\",\"fri\"] or [\"weekdays\"]. Omit for every day.",
        },
        timesPerWeek: { type: "integer", minimum: 1, maximum: 6, description: "Flexible target instead of fixed days, e.g. 3." },
        time: { type: "string", description: "HH:MM reminder time. Omit for no reminder." },
        pillar: {
          type: "string",
          enum: ["work", "sleep", "nutrition", "mind", "exercise", "finance"],
          description: "Optional; inferred from the name.",
        },
      },
    },
  },
  {
    id: "update_habit",
    method: "POST",
    path: "/habits/update",
    scope: "edit_habits",
    summary: "Rename or change a habit, by name",
    description:
      "Renames a habit or changes its description, days or time. Pass the habit as the user said it plus only the fields to change: name for a rename, days ([\"mon\",\"thu\"], \"weekdays\", \"every day\"), timesPerWeek, time (HH:MM, or \"\" for no reminder), description. Read back `say`.",
    body: {
      type: "object",
      required: ["habit"],
      properties: {
        habit: { type: "string", description: "The habit to change, as the user said it, or its id." },
        name: { type: "string", description: "New name." },
        description: { type: "string", description: "New description; empty string clears it." },
        days: { type: "array", items: { type: "string" }, description: "New days, e.g. [\"mon\",\"wed\"], [\"weekdays\"], [\"every day\"]." },
        timesPerWeek: { type: "integer", minimum: 1, maximum: 7, description: "Flexible weekly target instead of fixed days." },
        time: { type: "string", description: "HH:MM reminder time, or empty for none." },
      },
    },
  },
  {
    id: "delete_habit",
    method: "POST",
    path: "/habits/delete",
    scope: "delete_habits",
    summary: "Delete a habit and its history (off unless enabled)",
    description:
      "Permanently deletes a habit and all its completions. Only when the user explicitly asks to delete it, and confirm the name with them first. Off by default: if it returns scope_disabled, relay the message (suggest archiving in the app). Read back `say`.",
    body: {
      type: "object",
      required: ["habit"],
      properties: { habit: { type: "string", description: "The habit to delete, as the user said it, or its id." } },
    },
  },
  {
    id: "add_todo",
    method: "POST",
    path: "/todos",
    scope: "todos",
    summary: "Create a todo",
    description: "Adds a todo. Only title is required; dueDate for 'by Friday'. Read back `say`.",
    body: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", description: "What needs doing." },
        dueDate: { type: "string", description: "YYYY-MM-DD." },
        dueTime: { type: "string", description: "HH:MM, 24-hour." },
        priority: { type: "integer", minimum: 1, maximum: 5, description: "1 low … 5 urgent. Default 3." },
      },
    },
  },
  {
    id: "set_todo_status",
    method: "POST",
    path: "/todos/status",
    scope: "todos",
    summary: "Finish, start or reopen a todo, by name",
    description:
      "Pass the todo as the user said it (\"the bank call\"); it's matched for you. status defaults to completed. Read back `say`; on 409 ask which of `options`.",
    body: {
      type: "object",
      required: ["todo"],
      properties: {
        todo: { type: "string", description: "The todo's title as the user said it, or its id." },
        status: { type: "string", enum: ["completed", "in_progress", "incomplete"], description: "Default completed." },
      },
    },
  },
  {
    id: "list_todos",
    method: "GET",
    path: "/todos",
    scope: "read",
    summary: "All open todos",
    description: "Only when the user asks for their todo list beyond what get_today shows.",
    params: [
      { name: "status", in: "query", description: "pending (default use), completed or all.", schema: { type: "string", enum: ["pending", "completed", "all"] } },
      { name: "sort", in: "query", description: "deadline, priority or created.", schema: { type: "string", enum: ["deadline", "priority", "created"] } },
    ],
  },
  {
    id: "get_stats",
    method: "GET",
    path: "/stats",
    scope: "read",
    summary: "Week and month numbers",
    description: "Completion rate today and over 7 days, best current streak, 30-day series. For 'how was my week'.",
  },
  {
    id: "list_habits",
    method: "GET",
    path: "/habits",
    scope: "read",
    summary: "Every habit with streaks and 7/30-day rates",
    description: "Only for questions about specific habits' history or rates. Not needed before log_habit.",
  },
  {
    id: "search_catalog",
    method: "GET",
    path: "/catalog",
    scope: "read",
    summary: "Find protocols and habits to recommend",
    description:
      "Searches the Liberture catalog. Give the user `infoUrl` (its page on this site) for anything you suggest. `adopted` = they already track it. For something the user simply wants to track, use create_habit instead.",
    params: [
      { name: "q", in: "query", description: "Words to match, e.g. 'sleep caffeine'.", schema: { type: "string" } },
      { name: "pillar", in: "query", description: "Limit to one pillar.", schema: { type: "string", enum: ["work", "sleep", "nutrition", "mind", "exercise", "finance"] } },
      { name: "limit", in: "query", description: "Max results per kind, default 10.", schema: { type: "integer", minimum: 1, maximum: 50 } },
    ],
  },
  {
    id: "adopt_habit",
    method: "POST",
    path: "/habits/adopt",
    scope: "add_habits",
    summary: "Add a catalog protocol or habit",
    description:
      "Adds a protocol's habits (protocolSlug) or one catalog habit (habitSlug) from search_catalog, when the user asks. Read back `say`. If refused with scope_disabled, give them the infoUrl instead.",
    body: {
      type: "object",
      properties: {
        protocolSlug: { type: "string", description: "Protocol slug from search_catalog." },
        habitSlug: { type: "string", description: "Habit slug from search_catalog." },
      },
    },
  },
  {
    id: "get_recommendations",
    method: "GET",
    path: "/coach/recommendations",
    scope: "read",
    summary: "The in-app coach's latest suggestions",
    description: "What the in-app coach last suggested, with reasons and infoUrl links. Empty if it hasn't run.",
  },
]

const ERROR_SCHEMA = {
  type: "object",
  properties: {
    error: { type: "string" },
    code: { type: "string", description: "scope_disabled, rate_limited, …" },
    message: { type: "string", description: "What to tell the user." },
  },
}

/** OpenAPI 3.1 document for a Custom GPT action. */
export function buildOpenApiDocument(origin: string): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const op of API_OPERATIONS) {
    const operation: Record<string, unknown> = {
      operationId: op.id,
      summary: op.summary,
      description: op.description,
      "x-openai-isConsequential": op.method !== "GET",
      responses: {
        "200": op.markdown
          ? { description: "OK", content: { "text/markdown": { schema: { type: "string" } } } }
          : { description: "OK", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
        "401": { description: "Missing or revoked token" },
        "403": { description: "The user switched this permission off", content: { "application/json": { schema: ERROR_SCHEMA } } },
        "429": { description: "Too many requests", content: { "application/json": { schema: ERROR_SCHEMA } } },
      },
    }
    if (op.params?.length) operation.parameters = op.params
    if (op.body) operation.requestBody = { required: true, content: { "application/json": { schema: op.body } } }
    paths[op.path] = { ...(paths[op.path] ?? {}), [op.method.toLowerCase()]: operation }
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Liberture",
      version: "1.0.0",
      description:
        "Read and update the user's habit tracker: today's habits, streaks, todos and the Liberture protocol catalog. Start with get_today; write tools take names.",
    },
    servers: [{ url: `${origin}/api/v1` }],
    components: {
      securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", description: "An access token from signing in (OAuth, see /.well-known/oauth-authorization-server), or the script token from Settings → Voice assistants → Advanced." } },
      schemas: {},
    },
    security: [{ bearerAuth: [] }],
    paths,
  }
}
