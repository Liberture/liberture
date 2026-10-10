import { createHash } from "node:crypto"
import type { ApiScope } from "@/lib/habits/api-scopes"

/**
 * The assistant-facing surface, described once.
 *
 * Three things are generated from this list and must not drift apart:
 *   - GET /api/v1/openapi.json  (ChatGPT Custom GPT actions)
 *   - the tools of /mcp and /api/mcp/<token>  (Claude and ChatGPT connectors)
 *   - the reference table on /docs/api
 *
 * A Custom GPT allows at most 30 operations, so the OpenAPI document carries
 * every entry except those marked `mcpOnly` (MCP has no such limit). Keep
 * `API_OPERATIONS.filter((op) => !op.mcpOnly).length <= 30`; a test checks it.
 * Every tool is also one more thing a voice assistant can pick wrongly, so
 * descriptions say when *not* to call it. The rest of /api/v1 still works for
 * scripts; see API.md.
 */

type JsonType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "null"

export interface JsonSchema {
  type?: JsonType | readonly JsonType[]
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

/** MCP tool hints. Defaults: GET is read-only and idempotent; nothing is destructive. */
export interface ApiAnnotations {
  readOnly?: boolean
  destructive?: boolean
  idempotent?: boolean
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
  /** MCP only: left out of the OpenAPI document to stay within the Custom GPT limit. */
  mcpOnly?: boolean
  annotations?: ApiAnnotations
  /** MCP outputSchema of a successful result (structuredContent). A JSON array result is wrapped as { items }. */
  output?: JsonSchema
  /** Cursor-paged list: the MCP call sends this limit when the model doesn't. */
  paginated?: { defaultLimit: number }
}

const TZ_PARAM: ApiParam = {
  name: "tz",
  in: "query",
  description: "The user's IANA time zone, e.g. America/Argentina/Buenos_Aires. Decides what 'today' means; defaults to the zone saved in their settings.",
  schema: { type: "string" },
}

const LIMIT_PARAM = (max: number): ApiParam => ({
  name: "limit",
  in: "query",
  description: `Page size, 1-${max}.`,
  schema: { type: "integer", minimum: 1, maximum: max },
})

const CURSOR_PARAM: ApiParam = {
  name: "cursor",
  in: "query",
  description: "nextCursor from the previous page, to get the next one. Omit for the first page.",
  schema: { type: "string" },
}

const PILLARS = ["work", "sleep", "nutrition", "mind", "exercise", "finance"] as const

const HABIT_NAME = (verb: string): JsonSchema => ({ type: "string", description: `The habit to ${verb}, as the user said it, or its id.` })
const TODO_NAME = (verb: string): JsonSchema => ({ type: "string", description: `The todo to ${verb}: its title as the user said it, or its id.` })
const EVENT_NAME = (verb: string): JsonSchema => ({ type: "string", description: `The event to ${verb}: its title as the user said it, or its id.` })
const PROJECT_NAME = (verb: string): JsonSchema => ({ type: "string", description: `The project to ${verb}, by name, or its id.` })

/** Richer habit fields, shared by create_habit and update_habit. */
const HABIT_DETAILS: Record<string, JsonSchema> = {
  priority: { type: "integer", minimum: 1, maximum: 5, description: "1 low … 5 most important. 4-5 counts as critical." },
  color: { type: "string", description: "Hex color like #3fcf8e. Usually leave it: it follows the pillar." },
  tags: {
    type: "array",
    items: { type: "string", enum: ["exercise", "reading", "meditation", "health", "productivity", "social", "creative", "personal", "nutrition", "sleep", "mindfulness", "learning", "finance", "selfcare"] },
    description: "Tags; replaces the current ones.",
  },
  dataEntry: {
    type: "object",
    description: "Track a number each day, e.g. { unit: \"pushups\", goalValue: 100 }. Done once the goal is reached. Send { enabled: false } to stop tracking.",
    properties: {
      unit: { type: "string", description: "What is counted: pushups, km, pages, glasses." },
      goalValue: { type: "number", description: "Daily target." },
      label: { type: "string", description: "Field name shown in the app, if different from the unit." },
      enabled: { type: "boolean", description: "false stops tracking a number." },
    },
  },
  intention: {
    type: "object",
    description: "The plan: \"After I <trigger>, I will <behavior>\".",
    properties: {
      trigger: { type: "string", description: "The cue, e.g. \"pour my morning coffee\"." },
      behavior: { type: "string", description: "The tiny action, e.g. \"meditate for 2 minutes\"." },
    },
  },
  identity: { type: "string", description: "Who this habit makes them, e.g. \"runner\". Empty clears it." },
  randomReminders: { type: "boolean", description: "Random nudges during the day." },
}

const SAY: JsonSchema = { type: "string", description: "One sentence to read back to the user." }
const SAY_OUTPUT: JsonSchema = { type: "object", properties: { say: SAY }, additionalProperties: true }
const ITEMS_OUTPUT = (what: string): JsonSchema => ({
  type: "object",
  properties: { items: { type: "array", items: { type: "object", additionalProperties: true }, description: what } },
  required: ["items"],
})
const PAGE_OUTPUT = (key: string, what: string): JsonSchema => ({
  type: "object",
  properties: {
    [key]: { type: "array", items: { type: "object", additionalProperties: true }, description: what },
    nextCursor: { type: ["string", "null"], description: "Pass as cursor for the next page; null on the last." },
    total: { type: "integer" },
  },
  required: [key],
  additionalProperties: true,
})

const EVENT_TIME_FIELDS: Record<string, JsonSchema> = {
  startsAt: { type: "string", description: "Start, ISO 8601. Without an offset (2026-10-09T15:00) it's the user's local time." },
  endsAt: { type: "string", description: "End, ISO 8601. Or give durationMinutes." },
  durationMinutes: { type: "integer", minimum: 1, description: "Length in minutes; default 60." },
  location: { type: "string", description: "Where." },
  notes: { type: "string", description: "Notes." },
  tags: { type: "array", items: { type: "string" }, description: "Tags." },
}

export const API_OPERATIONS: readonly ApiOperation[] = [
  // ------------------------------------------------------------- start here
  {
    id: "get_today",
    method: "GET",
    path: "/summary",
    scope: "read",
    summary: "Start here: the date, the user, today's habits and urgent todos",
    description:
      "The only call needed to start a conversation. Short markdown: today's date and weekday, the user's name, any actions they switched off, habits still to do and done (with streaks), notable streaks, overdue and due-today todos. Call it once, then act directly — the write tools take names, so don't list habits or todos first. format=json returns the same as data.",
    params: [
      TZ_PARAM,
      { name: "date", in: "query", description: "YYYY-MM-DD to look at another day. Omit for today.", schema: { type: "string" } },
      { name: "format", in: "query", description: "markdown (default) or json.", schema: { type: "string", enum: ["markdown", "json"] } },
    ],
    markdown: true,
    output: {
      type: "object",
      description: "{ markdown } by default; the fields below with format=json.",
      properties: {
        markdown: { type: "string" },
        date: { type: "string" },
        habits: { type: "array", items: { type: "object", additionalProperties: true } },
        done: { type: "integer" },
        total: { type: "integer" },
        openTodos: { type: "integer" },
        overdueTodos: { type: "integer" },
      },
    },
  },

  // ------------------------------------------------------------- habits
  {
    id: "log_habit",
    method: "POST",
    path: "/completions/toggle",
    scope: "log_completions",
    summary: "Mark a habit done (or undo it), by name",
    description:
      "Marks a habit done for today, or for `date`. Pass the habit as the user said it (\"walk\", \"meditación\"); it's matched for you, no lookup needed. completed: false undoes it, which removes that day's record including any note or values logged with it. Optional note (\"felt great\") and value (a number for habits that track one). Read back the `say` field. On 409 ask which of `options`; on 404 offer create_habit.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["habit"],
      properties: {
        habit: { type: "string", description: "The habit's name as the user said it, or its id." },
        completed: { type: "boolean", description: "true = done (default), false = undo." },
        date: { type: "string", description: "YYYY-MM-DD. Omit for today." },
        note: { type: "string", description: "Optional note for the day, in the user's words." },
        value: { type: "number", description: "Optional number for a habit that tracks one (20 pushups → 20)." },
        timeZone: { type: "string", description: "IANA time zone, used when date is omitted." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "log_habit_value",
    method: "POST",
    path: "/completions/log",
    scope: "log_completions",
    summary: "Log an amount or a note for a habit (\"20 pushups\")",
    description:
      "For amounts and notes: \"log 20 pushups\", \"slept 7 hours, woke up rested\". Amounts add up over the day and the habit counts as done once its goal is reached. value goes to the habit's tracked number (unit picks which one when it tracks several); values sets several by name. For a plain \"I did it\" use log_habit. Read back `say`.",
    annotations: { idempotent: false },
    body: {
      type: "object",
      required: ["habit"],
      properties: {
        habit: { type: "string", description: "The habit's name as the user said it, or its id." },
        value: { type: "number", description: "The amount, e.g. 20." },
        unit: { type: "string", description: "What the amount is in (pushups, km), when the habit tracks several things." },
        values: { type: "object", additionalProperties: { type: "number" }, description: "Several amounts by field name, e.g. { \"hours\": 7, \"quality\": 4 }." },
        note: { type: "string", description: "A note for the day, in the user's words." },
        date: { type: "string", description: "YYYY-MM-DD. Omit for today." },
        timeZone: { type: "string", description: "IANA time zone, used when date is omitted." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "get_habit",
    method: "GET",
    path: "/habits/detail",
    scope: "read",
    summary: "Everything about one habit, by name",
    description:
      "One habit in detail: schedule, time, plan (intention), what number it tracks, streaks, the last two weeks with notes, and its catalog page (infoUrl) if it came from one. For \"how is my running going\".",
    params: [{ name: "habit", in: "query", required: true, description: "The habit, as the user said it, or its id.", schema: { type: "string" } }, TZ_PARAM],
    output: SAY_OUTPUT,
  },
  {
    id: "get_habit_history",
    method: "GET",
    path: "/habits/history",
    scope: "read",
    summary: "One habit's logged days, values and notes",
    description:
      "The days a habit was logged, newest first, with amounts and notes. Paged: pass nextCursor back as cursor for older days. For \"how many pushups did I do this month\".",
    params: [
      { name: "habit", in: "query", required: true, description: "The habit, as the user said it, or its id.", schema: { type: "string" } },
      { name: "days", in: "query", description: "How far back, default 90.", schema: { type: "integer", minimum: 1, maximum: 3650 } },
      LIMIT_PARAM(366),
      CURSOR_PARAM,
      TZ_PARAM,
    ],
    paginated: { defaultLimit: 30 },
    output: PAGE_OUTPUT("entries", "Logged days, newest first."),
  },
  {
    id: "create_habit",
    method: "POST",
    path: "/habits",
    scope: "add_habits",
    summary: "Create any habit, e.g. running",
    description:
      "Creates a habit that isn't in the catalog. Only name is required: it defaults to every day with no reminder, so don't ask follow-up questions — create it, read back `say`, and let the user change it. days takes names ([\"mon\",\"thu\"], \"weekdays\", \"weekends\"); time HH:MM sets a reminder. For \"100 pushups a day\" set dataEntry { unit: \"pushups\", goalValue: 100 }.",
    annotations: { idempotent: true },
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
        pillar: { type: "string", enum: PILLARS, description: "Optional; inferred from the name." },
        ...HABIT_DETAILS,
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "update_habit",
    method: "POST",
    path: "/habits/update",
    scope: "edit_habits",
    summary: "Rename or change a habit, by name",
    description:
      "Changes a habit. Pass the habit as the user said it plus only the fields to change: name for a rename, days ([\"mon\",\"thu\"], \"weekdays\", \"every day\"), timesPerWeek, time (HH:MM, or \"\" for no reminder), description, pillar, priority, tags, dataEntry (a number to track and its goal), intention, identity, randomReminders. Read back `say`.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["habit"],
      properties: {
        habit: HABIT_NAME("change"),
        name: { type: "string", description: "New name." },
        description: { type: "string", description: "New description; empty string clears it." },
        days: { type: "array", items: { type: "string" }, description: "New days, e.g. [\"mon\",\"wed\"], [\"weekdays\"], [\"every day\"]." },
        timesPerWeek: { type: "integer", minimum: 1, maximum: 7, description: "Flexible weekly target instead of fixed days." },
        time: { type: "string", description: "HH:MM reminder time, or empty for none." },
        pillar: { type: "string", enum: PILLARS, description: "Life area; the color follows it." },
        ...HABIT_DETAILS,
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "archive_habit",
    method: "POST",
    path: "/habits/archive",
    scope: "edit_habits",
    summary: "Archive a habit (keeps its history), by name",
    description:
      "Hides a habit and pauses it without losing its history. What to do when the user wants to stop or drop a habit; prefer it to delete_habit. Read back `say`.",
    annotations: { idempotent: true },
    body: { type: "object", required: ["habit"], properties: { habit: HABIT_NAME("archive") } },
    output: SAY_OUTPUT,
  },
  {
    id: "unarchive_habit",
    method: "POST",
    path: "/habits/unarchive",
    scope: "edit_habits",
    summary: "Bring an archived habit back, by name",
    description: "Restores an archived habit to the user's list. Read back `say`.",
    annotations: { idempotent: true },
    body: { type: "object", required: ["habit"], properties: { habit: HABIT_NAME("bring back") } },
    output: SAY_OUTPUT,
  },
  {
    id: "delete_habit",
    method: "POST",
    path: "/habits/delete",
    scope: "delete_habits",
    summary: "Delete a habit and its history (off unless enabled)",
    description:
      "Permanently deletes a habit and all its completions. Only when the user explicitly asks to delete it, and confirm the name with them first; to stop a habit, archive_habit is usually what they want. Off by default: if it returns scope_disabled, offer archive_habit. Read back `say`.",
    annotations: { destructive: true, idempotent: true },
    body: { type: "object", required: ["habit"], properties: { habit: HABIT_NAME("delete") } },
    output: SAY_OUTPUT,
  },
  {
    id: "list_habits",
    method: "GET",
    path: "/habits",
    scope: "read",
    summary: "Every habit with streaks and 7/30-day rates",
    description: "Only for questions about all habits' rates or streaks. Not needed before log_habit; for one habit use get_habit.",
    params: [
      TZ_PARAM,
      { name: "includeArchived", in: "query", description: "true to include archived habits.", schema: { type: "boolean" } },
    ],
    output: ITEMS_OUTPUT("Habits with id, name, schedule, time, priority, streaks, rates and archived."),
  },

  // ------------------------------------------------------------- todos and projects
  {
    id: "add_todo",
    method: "POST",
    path: "/todos",
    scope: "todos",
    summary: "Create a todo",
    description:
      "Adds a todo. Only title is required; dueDate for 'by Friday'. project is a name; a new name creates the project. subtasks can be plain strings. Read back `say`.",
    annotations: { idempotent: false },
    body: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string", description: "What needs doing." },
        description: { type: "string", description: "More detail." },
        dueDate: { type: "string", description: "YYYY-MM-DD." },
        dueTime: { type: "string", description: "HH:MM, 24-hour." },
        priority: { type: "integer", minimum: 1, maximum: 5, description: "1 low … 5 urgent. Default 3." },
        project: { type: "string", description: "Project name, e.g. \"House\"." },
        tags: { type: "array", items: { type: "string" }, description: "Tags." },
        subtasks: { type: "array", items: { type: "string" }, description: "Steps, e.g. [\"call the bank\", \"send the form\"]." },
        notes: { type: "string", description: "Notes." },
        estimatedMinutes: { type: "integer", minimum: 1, description: "How long it should take." },
        energyLevel: { type: "string", enum: ["low", "medium", "high"], description: "Energy it needs." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "update_todo",
    method: "POST",
    path: "/todos/update",
    scope: "todos",
    summary: "Change a todo, by name",
    description:
      "Changes a todo: new title, due date or time (\"move it to Friday\"), priority, project (a name; \"\" removes it), tags, subtasks, notes, description, estimatedMinutes, energyLevel. Send only what changes. To finish it use set_todo_status. Read back `say`; on 409 ask which of `options`.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["todo"],
      properties: {
        todo: TODO_NAME("change"),
        title: { type: "string", description: "New title." },
        description: { type: "string", description: "New description." },
        dueDate: { type: "string", description: "YYYY-MM-DD, or \"\" for no due date." },
        dueTime: { type: "string", description: "HH:MM, or \"\" for none." },
        priority: { type: "integer", minimum: 1, maximum: 5, description: "1 low … 5 urgent." },
        project: { type: "string", description: "Project name; \"\" removes it from its project." },
        tags: { type: "array", items: { type: "string" }, description: "Tags; replaces the current ones." },
        subtasks: { type: "array", items: { type: "string" }, description: "Steps; replaces the current ones." },
        notes: { type: "string", description: "Notes." },
        estimatedMinutes: { type: "integer", minimum: 1, description: "How long it should take." },
        energyLevel: { type: "string", enum: ["low", "medium", "high"], description: "Energy it needs." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "set_todo_status",
    method: "POST",
    path: "/todos/status",
    scope: "todos",
    summary: "Finish, start or reopen a todo, by name",
    description:
      "Pass the todo as the user said it (\"the bank call\"); it's matched for you. status defaults to completed. Read back `say`; on 409 ask which of `options`.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["todo"],
      properties: {
        todo: { type: "string", description: "The todo's title as the user said it, or its id." },
        status: { type: "string", enum: ["completed", "in_progress", "incomplete"], description: "Default completed." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "delete_todo",
    method: "POST",
    path: "/todos/delete",
    scope: "delete_items",
    summary: "Delete a todo (off unless enabled)",
    description:
      "Deletes a todo for good. Only when the user asks to delete or remove it; if it's done, use set_todo_status instead. Off by default: on scope_disabled, relay the message. Read back `say`.",
    annotations: { destructive: true, idempotent: true },
    body: { type: "object", required: ["todo"], properties: { todo: TODO_NAME("delete") } },
    output: SAY_OUTPUT,
  },
  {
    id: "list_todos",
    method: "GET",
    path: "/todos",
    scope: "read",
    summary: "The todo list, filtered and paged",
    description:
      "Only when the user asks for their todo list beyond what get_today shows. Filter by status, overdue or project; paged (pass nextCursor back as cursor).",
    params: [
      { name: "status", in: "query", description: "pending (default use), completed or all.", schema: { type: "string", enum: ["pending", "completed", "all"] } },
      { name: "sort", in: "query", description: "deadline, priority or created.", schema: { type: "string", enum: ["deadline", "priority", "created"] } },
      { name: "overdue", in: "query", description: "true for only overdue todos.", schema: { type: "boolean" } },
      { name: "project", in: "query", description: "Only this project, by name.", schema: { type: "string" } },
      LIMIT_PARAM(100),
      CURSOR_PARAM,
    ],
    paginated: { defaultLimit: 25 },
    output: PAGE_OUTPUT("todos", "Todos with id, title, dueDate, priority, status, projectId and urgency."),
  },
  {
    id: "list_projects",
    method: "GET",
    path: "/projects",
    scope: "read",
    summary: "The user's todo projects",
    description: "Project names and ids. Rarely needed: add_todo, update_todo and list_todos take project names.",
    output: ITEMS_OUTPUT("Projects with id, name and color."),
  },
  {
    id: "create_project",
    method: "POST",
    path: "/projects",
    scope: "todos",
    summary: "Create a todo project",
    description: "Creates a project, or returns the existing one with that name. add_todo also creates one when given a new project name.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["name"],
      properties: { name: { type: "string", description: "Project name." }, color: { type: "string", description: "Optional hex color." } },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "update_project",
    method: "POST",
    path: "/projects/update",
    scope: "todos",
    summary: "Rename or recolor a project, by name",
    description: "Renames or recolors a project. Read back `say`.",
    mcpOnly: true,
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["project"],
      properties: {
        project: PROJECT_NAME("change"),
        name: { type: "string", description: "New name." },
        color: { type: "string", description: "New hex color." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "delete_project",
    method: "POST",
    path: "/projects/delete",
    scope: "delete_items",
    summary: "Delete a project; its todos stay (off unless enabled)",
    description: "Deletes a project; its todos are kept without a project. Only when the user asks. Off by default. Read back `say`.",
    mcpOnly: true,
    annotations: { destructive: true, idempotent: true },
    body: { type: "object", required: ["project"], properties: { project: PROJECT_NAME("delete") } },
    output: SAY_OUTPUT,
  },

  // ------------------------------------------------------------- calendar
  {
    id: "get_agenda",
    method: "GET",
    path: "/calendar/agenda",
    scope: "read",
    summary: "Upcoming events plus the todos to focus on",
    description: "Calendar events for the next days (default 7) with the in-progress and next todos. For \"what's my week look like\".",
    params: [
      { name: "days", in: "query", description: "How many days ahead, 1-30.", schema: { type: "integer", minimum: 1, maximum: 30 } },
      { name: "start", in: "query", description: "ISO start; default today.", schema: { type: "string" } },
    ],
    output: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        events: { type: "array", items: { type: "object", additionalProperties: true } },
        focusTodos: { type: "array", items: { type: "object", additionalProperties: true } },
        nextTodos: { type: "array", items: { type: "object", additionalProperties: true } },
      },
      additionalProperties: true,
    },
  },
  {
    id: "list_events",
    method: "GET",
    path: "/calendar",
    scope: "read",
    summary: "Calendar events in a date range, paged",
    description: "Events between start and end (default the next 30 days), optionally by tag. Paged: pass nextCursor back as cursor. get_agenda is usually enough.",
    params: [
      { name: "start", in: "query", description: "ISO start; default today.", schema: { type: "string" } },
      { name: "end", in: "query", description: "ISO end.", schema: { type: "string" } },
      { name: "days", in: "query", description: "Days after start when end is omitted, default 30.", schema: { type: "integer", minimum: 1, maximum: 366 } },
      { name: "tag", in: "query", description: "Only events with this tag.", schema: { type: "string" } },
      LIMIT_PARAM(100),
      CURSOR_PARAM,
    ],
    paginated: { defaultLimit: 25 },
    output: PAGE_OUTPUT("events", "Events with id, title, startsAt, endsAt, location and notes."),
  },
  {
    id: "create_event",
    method: "POST",
    path: "/calendar",
    scope: "calendar",
    summary: "Add a calendar event",
    description:
      "Adds an event: title and startsAt (local time is fine, e.g. 2026-10-09T15:00); default one hour. To block time for an existing todo use schedule_todo. Read back `say`.",
    annotations: { idempotent: false },
    body: {
      type: "object",
      required: ["title", "startsAt"],
      properties: { title: { type: "string", description: "What it is." }, ...EVENT_TIME_FIELDS },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "update_event",
    method: "POST",
    path: "/calendar/update",
    scope: "calendar",
    summary: "Move or change an event, by name",
    description:
      "Moves or edits an event by its title (\"move the dentist to Friday at 10\"). A new startsAt keeps the length unless endsAt or durationMinutes is given. Read back `say`; on 409 ask which of `options`.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["event"],
      properties: { event: EVENT_NAME("change"), title: { type: "string", description: "New title." }, ...EVENT_TIME_FIELDS },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "delete_event",
    method: "POST",
    path: "/calendar/delete",
    scope: "delete_items",
    summary: "Delete a calendar event (off unless enabled)",
    description: "Deletes an event, by title. Only when the user asks to cancel or delete it. Off by default: on scope_disabled, offer update_event to move it. Read back `say`.",
    annotations: { destructive: true, idempotent: true },
    body: { type: "object", required: ["event"], properties: { event: EVENT_NAME("delete") } },
    output: SAY_OUTPUT,
  },
  {
    id: "schedule_todo",
    method: "POST",
    path: "/todos/schedule",
    scope: "calendar",
    summary: "Block calendar time for a todo, by name",
    description:
      "Puts a todo on the calendar (\"do the taxes Saturday at 10\"). Length defaults to the todo's estimate, else an hour. Read back `say`.",
    annotations: { idempotent: false },
    body: {
      type: "object",
      required: ["todo", "startsAt"],
      properties: { todo: TODO_NAME("schedule"), ...EVENT_TIME_FIELDS },
    },
    output: SAY_OUTPUT,
  },

  // ------------------------------------------------------------- progress and catalog
  {
    id: "get_stats",
    method: "GET",
    path: "/stats",
    scope: "read",
    summary: "Week and month numbers",
    description: "Completion rate today and over 7 days, best current streak, 30-day series. For 'how was my week'. `definitions` explains each number (activeHabits = logged in the last 30 days, not 'not archived'); archived habits are excluded, so archive_habit removes test habits from stats.",
    params: [TZ_PARAM],
    output: SAY_OUTPUT,
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
      { name: "pillar", in: "query", description: "Limit to one pillar.", schema: { type: "string", enum: PILLARS } },
      { name: "limit", in: "query", description: "Max results per kind, default 10.", schema: { type: "integer", minimum: 1, maximum: 50 } },
    ],
    output: SAY_OUTPUT,
  },
  {
    id: "adopt_habit",
    method: "POST",
    path: "/habits/adopt",
    scope: "add_habits",
    summary: "Add a catalog protocol or habit",
    description:
      "Adds a protocol's habits (protocolSlug) or one catalog habit (habitSlug) from search_catalog, when the user asks. Read back `say`. If refused with scope_disabled, give them the infoUrl instead.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      properties: {
        protocolSlug: { type: "string", description: "Protocol slug from search_catalog." },
        habitSlug: { type: "string", description: "Habit slug from search_catalog." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "get_recommendations",
    method: "GET",
    path: "/coach/recommendations",
    scope: "read",
    summary: "The in-app coach's latest suggestions",
    description: "What the in-app coach last suggested, with reasons and infoUrl links. Empty if it hasn't run.",
    params: [TZ_PARAM],
    output: SAY_OUTPUT,
  },

  // ------------------------------------------------------------- coach (MCP only)
  {
    id: "get_coach_state",
    method: "GET",
    path: "/coach/state",
    scope: "read",
    summary: "Coach settings, nudges left today and habits needing a word",
    description:
      "Call before any proactive message (a scheduled check-in or automation). Returns the check-in settings, quiet hours, the daily limit with nudges sent and remaining today, the last nudge per kind, pending and snoozed suggestions, and per habit lastLoggedOn, unloggedDueDays and weeklyProgress. Then call record_coach_nudge and message the user only if it says allowed.",
    mcpOnly: true,
    params: [TZ_PARAM],
    output: {
      type: "object",
      properties: {
        settings: { type: "object", additionalProperties: true },
        nudges: { type: "object", additionalProperties: true },
        suggestions: { type: "object", additionalProperties: true },
        habits: { type: "array", items: { type: "object", additionalProperties: true } },
      },
      additionalProperties: true,
    },
  },
  {
    id: "record_coach_nudge",
    method: "POST",
    path: "/coach/nudge",
    scope: "settings",
    summary: "Ask to send one coach message; records it if allowed",
    description:
      "Call right before you message the user unprompted. Applies quiet hours, the daily limit and duplicate checks, shared with Liberture's own push check-ins, and records the nudge when allowed. Duplicates: one morning, afternoon, evening and missed_logging nudge per day, one weekly per ISO week; `other` is checked per message, so different `other` messages are each allowed until the daily limit. Only message the user if `allowed` is true; otherwise stay silent (reason: quiet_hours, daily_limit or duplicate). Not needed when the user started the conversation.",
    mcpOnly: true,
    annotations: { idempotent: false },
    body: {
      type: "object",
      required: ["kind"],
      properties: {
        kind: {
          type: "string",
          enum: ["morning", "afternoon", "evening", "weekly", "missed_logging", "other"],
          description: "Which check-in this is.",
        },
        message: { type: "string", description: "What you plan to say, for the record. For kind `other` it is also the duplicate key." },
        timeZone: { type: "string", description: "IANA time zone; defaults to the saved one." },
      },
    },
    output: {
      type: "object",
      properties: {
        allowed: { type: "boolean" },
        reason: { type: ["string", "null"], description: "Why not: quiet_hours, daily_limit or duplicate. null when allowed." },
        remainingToday: { type: "integer" },
      },
      required: ["allowed"],
      additionalProperties: true,
    },
  },
  {
    id: "respond_to_suggestion",
    method: "POST",
    path: "/coach/respond",
    scope: "settings",
    summary: "Accept, dismiss or snooze a coach suggestion, by name",
    description:
      "Records what the user said about one of the coach's suggestions (get_recommendations or get_coach_state): accept, dismiss, or snooze for `days` (default 7). Pass the suggestion's name or slug. Accepting doesn't add the habit; use adopt_habit for that. Read back `say`.",
    mcpOnly: true,
    annotations: { idempotent: true },
    body: {
      type: "object",
      required: ["suggestion", "response"],
      properties: {
        suggestion: { type: "string", description: "The suggestion's name as the user said it, or its slug." },
        response: { type: "string", enum: ["accept", "dismiss", "snooze"], description: "What the user decided." },
        days: { type: "integer", minimum: 1, maximum: 90, description: "Snooze length in days, default 7." },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "get_reminder_status",
    method: "GET",
    path: "/reminders/status",
    scope: "read",
    summary: "Whether reminders and check-ins can reach the user",
    description:
      "Whether push reminders are set up (devices subscribed, server push on) and what was sent today. For \"why didn't I get a reminder\". sentToday counts claims, not confirmed deliveries: see sentTodayByChannel (assistant = nudges recorded by an assistant, which Liberture didn't deliver) and lastDeliveredAt.",
    mcpOnly: true,
    output: { type: "object", additionalProperties: true },
  },

  // ------------------------------------------------------------- profile and account
  {
    id: "get_profile",
    method: "GET",
    path: "/profile",
    scope: "read",
    summary: "The user's profile and app preferences",
    description:
      "Name, mission statement, focus habits, check-in times, and preferences: theme, week start, 12/24h clock, time zone, habits layout, morning dashboard, default reminder time, reminders on/off.",
    output: {
      type: "object",
      properties: {
        name: { type: ["string", "null"] },
        missionStatement: { type: ["string", "null"] },
        focusHabits: { type: "array", items: { type: "string" } },
        preferences: { type: "object", additionalProperties: true },
      },
      additionalProperties: true,
    },
  },
  {
    id: "update_profile",
    method: "POST",
    path: "/profile",
    scope: "settings",
    summary: "Change the user's profile or preferences",
    description:
      "Sets any of: name, missionStatement, focusHabits (up to 3 habit names), checkInTimes, theme, weekStartsOn (monday/sunday), timeFormat, timeZone (IANA), morningDashboard, habitsLayout, defaultReminderTime, notifications (reminders on/off), language, coach (check-in times, quiet hours, daily nudge limit). Send only what changes. Read back `say`.",
    annotations: { idempotent: true },
    body: {
      type: "object",
      properties: {
        name: { type: "string", description: "What to call the user." },
        missionStatement: { type: "string", description: "Their why, in their words." },
        focusHabits: { type: "array", items: { type: "string" }, description: "Up to 3 habit names to focus on; [] clears." },
        checkInTimes: {
          type: "object",
          description: "HH:MM times for check-ins.",
          properties: { morning: { type: "string" }, midday: { type: "string" }, evening: { type: "string" } },
        },
        theme: { type: "string", enum: ["system", "light", "dark"], description: "App theme." },
        weekStartsOn: { type: "string", enum: ["monday", "sunday"], description: "First day of the week." },
        timeFormat: { type: "string", enum: ["24h", "12h"], description: "Clock format." },
        timeZone: { type: "string", description: "IANA zone, e.g. Europe/Madrid. Decides what 'today' is for assistants." },
        morningDashboard: { type: "boolean", description: "Show the morning dashboard." },
        habitsLayout: { type: "string", enum: ["day", "week", "matrix"], description: "Default habits view." },
        defaultReminderTime: { type: "string", description: "HH:MM pre-filled for new habits, or \"\" for none." },
        notifications: { type: "boolean", description: "Habit reminders on or off." },
        language: { type: "string", enum: ["en", "es"], description: "Language of the messages Liberture sends (check-ins)." },
        coach: {
          type: "object",
          description:
            "Proactive coach settings; send only what changes. Check-ins are off until given a time; \"\" or null turns one off.",
          properties: {
            checkIns: {
              type: "object",
              properties: {
                morning: { type: ["string", "null"], description: "HH:MM: two priorities and a first action." },
                afternoon: { type: ["string", "null"], description: "HH:MM: the next thing still worth doing." },
                weekly: {
                  type: ["object", "null"],
                  description: "Weekly review: { day: 0 Sunday … 6 Saturday, time: HH:MM }.",
                  properties: { day: { type: "integer", minimum: 0, maximum: 6 }, time: { type: "string" } },
                },
              },
            },
            missedLogging: { type: "boolean", description: "Ask about habits left unlogged for 3+ due days." },
            quietHours: {
              type: "object",
              description: "No nudges between start and end (HH:MM; may wrap midnight).",
              properties: { start: { type: "string" }, end: { type: "string" } },
            },
            maxNudgesPerDay: { type: "integer", minimum: 1, maximum: 10, description: "Coach messages per day, all coaches combined." },
          },
        },
      },
    },
    output: SAY_OUTPUT,
  },
  {
    id: "get_permissions",
    method: "GET",
    path: "/assistant",
    scope: "read",
    summary: "What the user allows assistants to do",
    description: "The permission switches (on/off per action), today's date and the saved time zone. get_today already lists what's off; call this only when asked about permissions.",
    mcpOnly: true,
    output: {
      type: "object",
      properties: { permissions: { type: "object", additionalProperties: { type: "boolean" } }, today: { type: "string" } },
      additionalProperties: true,
    },
  },
  {
    id: "get_audit",
    method: "GET",
    path: "/audit",
    scope: "read",
    summary: "Drift check: missed critical habits and what to do",
    description:
      "Whether the user is drifting today: critical habits (their focus habits and priority 4-5) not yet done, current streaks, and short recommendations. For an evening check or \"am I on track\".",
    mcpOnly: true,
    params: [TZ_PARAM],
    output: {
      type: "object",
      properties: {
        drift: { type: "boolean" },
        critical: { type: "array", items: { type: "string" } },
        missedCritical: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } },
      },
      additionalProperties: true,
    },
  },
  {
    id: "export_data",
    method: "GET",
    path: "/export",
    scope: "export",
    summary: "Full JSON backup of the user's data",
    description: "Everything: habits, completions, todos, projects, events, profile and preferences. Large; only when the user asks for a backup or export.",
    mcpOnly: true,
    output: { type: "object", additionalProperties: true },
  },
]

/** The MCP input schema of an operation: its body properties plus its query/path params. */
export function inputSchemaFor(op: ApiOperation): JsonSchema {
  const properties: Record<string, JsonSchema> = { ...(op.body?.properties ?? {}) }
  const required = [...(op.body?.required ?? [])]
  for (const p of op.params ?? []) {
    properties[p.name] = { ...p.schema, description: p.description }
    if (p.required) required.push(p.name)
  }
  return { type: "object", properties, ...(required.length ? { required } : {}) }
}

/**
 * A short hash of every tool's name and input schema. Changes whenever a tool
 * is added, removed or takes different arguments, so a client (and the user,
 * in Settings and get_permissions) can tell its cached tool list is stale.
 */
export function computeToolsVersion(ops: readonly ApiOperation[]): string {
  const shape = ops.map((op) => ({ name: op.id, inputSchema: inputSchemaFor(op) }))
  return createHash("sha256").update(JSON.stringify(shape)).digest("hex").slice(0, 8)
}

export const TOOLS_VERSION = computeToolsVersion(API_OPERATIONS)
export const TOOL_COUNT = API_OPERATIONS.length
/** Every MCP tool name, for working out what a connection hasn't seen yet (connector-sync.ts). */
export const MCP_TOOL_NAMES: readonly string[] = API_OPERATIONS.map((op) => op.id)
/** serverInfo.version (MCP) and info.version (OpenAPI). */
export const SERVER_VERSION = `1.2.0+${TOOLS_VERSION}`

/** The operations a Custom GPT gets (the OpenAPI document): everything not marked mcpOnly. */
export const OPENAPI_OPERATIONS: readonly ApiOperation[] = API_OPERATIONS.filter((op) => !op.mcpOnly)

const ERROR_SCHEMA = {
  type: "object",
  properties: {
    error: { type: "string" },
    code: { type: "string", description: "scope_disabled, rate_limited, ambiguous, not_found, …" },
    message: { type: "string", description: "What to tell the user." },
    say: { type: "string", description: "A question or sentence to read back (ambiguous / not_found)." },
    options: { type: "array", items: { type: "string" }, description: "Names to choose from, on 409 or 404." },
  },
}

/** OpenAPI 3.1 document for a Custom GPT action. */
export function buildOpenApiDocument(origin: string): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const op of OPENAPI_OPERATIONS) {
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
        "404": { description: "No match for the name given; `options` lists what exists", content: { "application/json": { schema: ERROR_SCHEMA } } },
        "409": { description: "The name matches more than one; ask which of `options`", content: { "application/json": { schema: ERROR_SCHEMA } } },
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
      version: SERVER_VERSION,
      description:
        "Read and update the user's habit tracker: today's habits, streaks, todos, calendar, profile and the Liberture protocol catalog. Start with get_today; write tools take names.",
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
