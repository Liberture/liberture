import { API_OPERATIONS, inputSchemaFor, type ApiOperation, type JsonSchema } from "@/lib/habits/api/operations"
import { OAUTH_SCOPE } from "@/lib/habits/oauth/metadata"
import { GET as getSummary } from "@/app/api/v1/summary/route"
import { GET as getHabits, POST as createHabit } from "@/app/api/v1/habits/route"
import { GET as getHabitDetail } from "@/app/api/v1/habits/detail/route"
import { GET as getHabitHistory } from "@/app/api/v1/habits/history/route"
import { POST as archiveHabit } from "@/app/api/v1/habits/archive/route"
import { POST as unarchiveHabit } from "@/app/api/v1/habits/unarchive/route"
import { POST as toggleCompletion } from "@/app/api/v1/completions/toggle/route"
import { POST as logCompletionValue } from "@/app/api/v1/completions/log/route"
import { GET as getStats } from "@/app/api/v1/stats/route"
import { GET as getTodos, POST as postTodo } from "@/app/api/v1/todos/route"
import { POST as setTodoStatus } from "@/app/api/v1/todos/status/route"
import { POST as updateTodo } from "@/app/api/v1/todos/update/route"
import { POST as deleteTodo } from "@/app/api/v1/todos/delete/route"
import { POST as scheduleTodo } from "@/app/api/v1/todos/schedule/route"
import { GET as getProjects, POST as createProject } from "@/app/api/v1/projects/route"
import { POST as updateProject } from "@/app/api/v1/projects/update/route"
import { POST as deleteProject } from "@/app/api/v1/projects/delete/route"
import { GET as getEvents, POST as createEvent } from "@/app/api/v1/calendar/route"
import { GET as getAgenda } from "@/app/api/v1/calendar/agenda/route"
import { POST as updateEvent } from "@/app/api/v1/calendar/update/route"
import { POST as deleteEvent } from "@/app/api/v1/calendar/delete/route"
import { GET as getCatalog } from "@/app/api/v1/catalog/route"
import { GET as getRecommendations } from "@/app/api/v1/coach/recommendations/route"
import { POST as adoptHabit } from "@/app/api/v1/habits/adopt/route"
import { POST as updateHabit } from "@/app/api/v1/habits/update/route"
import { POST as deleteHabit } from "@/app/api/v1/habits/delete/route"
import { GET as getProfile, POST as updateProfile } from "@/app/api/v1/profile/route"
import { GET as getAssistant } from "@/app/api/v1/assistant/route"
import { POST as completeWelcome } from "@/app/api/v1/assistant/welcome/route"
import { GET as getAudit } from "@/app/api/v1/audit/route"
import { GET as getExport } from "@/app/api/v1/export/route"
import { GET as getCoachState } from "@/app/api/v1/coach/state/route"
import { POST as recordCoachNudge } from "@/app/api/v1/coach/nudge/route"
import { POST as respondToSuggestion } from "@/app/api/v1/coach/respond/route"
import { GET as getReminderStatus } from "@/app/api/v1/reminders/status/route"

/**
 * MCP tools are the /api/v1 handlers, called in-process with the token as an
 * ordinary Bearer header. Scopes, rate limits and validation therefore apply
 * exactly as they do to a ChatGPT action — there is one code path, not two.
 */

export type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response> | Response

export const HANDLERS: Record<string, Handler> = {
  get_today: getSummary as Handler,
  log_habit: toggleCompletion as Handler,
  log_habit_value: logCompletionValue as Handler,
  get_habit: getHabitDetail as Handler,
  get_habit_history: getHabitHistory as Handler,
  create_habit: createHabit as Handler,
  update_habit: updateHabit as Handler,
  archive_habit: archiveHabit as Handler,
  unarchive_habit: unarchiveHabit as Handler,
  delete_habit: deleteHabit as Handler,
  list_habits: getHabits as Handler,
  add_todo: postTodo as Handler,
  update_todo: updateTodo as Handler,
  set_todo_status: setTodoStatus as Handler,
  delete_todo: deleteTodo as Handler,
  list_todos: getTodos as Handler,
  list_projects: getProjects as Handler,
  create_project: createProject as Handler,
  update_project: updateProject as Handler,
  delete_project: deleteProject as Handler,
  get_agenda: getAgenda as Handler,
  list_events: getEvents as Handler,
  create_event: createEvent as Handler,
  update_event: updateEvent as Handler,
  delete_event: deleteEvent as Handler,
  schedule_todo: scheduleTodo as Handler,
  get_stats: getStats as Handler,
  search_catalog: getCatalog as Handler,
  adopt_habit: adoptHabit as Handler,
  get_recommendations: getRecommendations as Handler,
  get_profile: getProfile as Handler,
  update_profile: updateProfile as Handler,
  get_permissions: getAssistant as Handler,
  complete_welcome: completeWelcome as Handler,
  get_audit: getAudit as Handler,
  export_data: getExport as Handler,
  get_coach_state: getCoachState as Handler,
  record_coach_nudge: recordCoachNudge as Handler,
  respond_to_suggestion: respondToSuggestion as Handler,
  get_reminder_status: getReminderStatus as Handler,
}

export interface McpAnnotations {
  title: string
  readOnlyHint: boolean
  destructiveHint: boolean
  idempotentHint: boolean
  openWorldHint: boolean
}

export interface McpTool {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  outputSchema: JsonSchema
  annotations: McpAnnotations
  /**
   * ChatGPT apps: every tool needs the user's sign-in. The OAuth grant is the
   * one `habits` scope; the second entry names the permission switch the tool
   * needs, which the server checks on every call (lib/habits/api-scopes.ts).
   */
  securitySchemes: { type: "oauth2"; scopes: string[] }[]
}

const DEFAULT_OUTPUT: JsonSchema = { type: "object", additionalProperties: true }

export function annotationsFor(op: ApiOperation): McpAnnotations {
  const readOnly = op.annotations?.readOnly ?? op.method === "GET"
  return {
    title: op.summary,
    readOnlyHint: readOnly,
    destructiveHint: op.annotations?.destructive ?? false,
    idempotentHint: op.annotations?.idempotent ?? readOnly,
    openWorldHint: false,
  }
}

export const MCP_TOOLS: McpTool[] = API_OPERATIONS.map((op) => ({
  name: op.id,
  title: op.summary,
  description: op.description,
  inputSchema: inputSchemaFor(op),
  outputSchema: op.output ?? DEFAULT_OUTPUT,
  annotations: annotationsFor(op),
  securitySchemes: [{ type: "oauth2", scopes: [OAUTH_SCOPE, op.scope] }],
}))

export interface McpToolResult {
  content: { type: "text"; text: string }[]
  structuredContent?: Record<string, unknown>
  isError: boolean
}

export interface ApiCallResult {
  status: number
  contentType: string
  text: string
}

/**
 * Calls one /api/v1 handler in-process as `token`. Shared by tools/call and
 * resources/read.
 */
export async function callApi(
  handler: Handler,
  method: string,
  path: string,
  token: string,
  origin: string,
  options: { query?: URLSearchParams; body?: string; pathParams?: Record<string, string>; timeZone?: string } = {}
): Promise<ApiCallResult> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  if (options.timeZone) headers["X-Time-Zone"] = options.timeZone
  const qs = options.query?.toString()
  const request = new Request(`${origin}/api/v1${path}${qs ? `?${qs}` : ""}`, { method, headers, body: options.body })
  const response = await handler(request, { params: Promise.resolve(options.pathParams ?? {}) })
  return { status: response.status, contentType: response.headers.get("content-type") ?? "", text: await response.text() }
}

/** Only the arguments the operation declares reach the handler. */
export function requestPartsFor(op: ApiOperation, args: Record<string, unknown>) {
  let path = op.path
  const pathParams: Record<string, string> = {}
  const query = new URLSearchParams()
  for (const p of op.params ?? []) {
    const value = args[p.name]
    if (value === undefined || value === null || value === "") continue
    if (p.in === "path") {
      pathParams[p.name] = String(value)
      path = path.replace(`{${p.name}}`, encodeURIComponent(String(value)))
    } else {
      query.set(p.name, String(value))
    }
  }
  if (op.paginated && !query.has("limit")) query.set("limit", String(op.paginated.defaultLimit))

  let body: string | undefined
  if (op.body) {
    const bodyKeys = Object.keys(op.body.properties ?? {})
    body = JSON.stringify(Object.fromEntries(bodyKeys.filter((k) => args[k] !== undefined).map((k) => [k, args[k]])))
  }

  const timeZone = typeof args.timeZone === "string" ? args.timeZone : typeof args.tz === "string" ? args.tz : undefined
  return { path, pathParams, query, body, timeZone }
}

/** structuredContent for a successful result: the JSON object, arrays as { items }, markdown as { markdown }. */
export function structuredFor(op: ApiOperation, result: ApiCallResult): Record<string, unknown> | undefined {
  if (result.status >= 400) return undefined
  if (result.contentType.includes("json")) {
    try {
      const parsed: unknown = JSON.parse(result.text)
      if (Array.isArray(parsed)) return { items: parsed }
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>
    } catch {
      return undefined
    }
  }
  if (op.markdown && result.text) return { markdown: result.text }
  return undefined
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
  token: string,
  origin: string
): Promise<McpToolResult | null> {
  const op = API_OPERATIONS.find((o) => o.id === name)
  const handler = HANDLERS[name]
  if (!op || !handler) return null

  const parts = requestPartsFor(op, args)
  const result = await callApi(handler, op.method, parts.path, token, origin, parts)

  // Lead with the sentence to speak, when there is one, so a voice client can
  // answer without parsing the JSON below it.
  type Body = { say?: unknown; message?: unknown; code?: unknown; options?: unknown; error?: unknown }
  const parsed = ((): Body | null => {
    try {
      const value: unknown = JSON.parse(result.text)
      return value && typeof value === "object" && !Array.isArray(value) ? (value as Body) : null
    } catch {
      return null // Markdown (get_today) or empty: send as-is.
    }
  })()
  const say = typeof parsed?.say === "string" ? parsed.say : typeof parsed?.message === "string" ? parsed.message : null
  const content: McpToolResult["content"] = say ? [{ type: "text", text: say }] : []
  content.push({ type: "text", text: result.text || `HTTP ${result.status}` })

  // "Which one?" and "not found" are answers, not failures: the model needs
  // `options` and `say` to ask the user. ChatGPT reduces an isError result to
  // a bare INVALID_ARGUMENT and drops them, so send these as ordinary results
  // whenever the tool's output schema allows it.
  const soft = (result.status === 404 || result.status === 409) && (parsed?.code === "not_found" || parsed?.code === "ambiguous")
  if (soft && !op.output?.required?.length) {
    return {
      content,
      structuredContent: {
        ok: false,
        code: parsed?.code,
        ...(Array.isArray(parsed?.options) ? { options: parsed.options } : {}),
        ...(say ? { say } : {}),
        ...(typeof parsed?.error === "string" ? { error: parsed.error } : {}),
      },
      isError: false,
    }
  }

  const structuredContent = structuredFor(op, result)
  return { content, ...(structuredContent ? { structuredContent } : {}), isError: result.status >= 400 }
}
