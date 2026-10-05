import { API_OPERATIONS, type ApiOperation, type JsonSchema } from "@/lib/habits/api/operations"
import { GET as getSummary } from "@/app/api/v1/summary/route"
import { GET as getHabits, POST as createHabit } from "@/app/api/v1/habits/route"
import { POST as toggleCompletion } from "@/app/api/v1/completions/toggle/route"
import { GET as getStats } from "@/app/api/v1/stats/route"
import { GET as getTodos, POST as postTodo } from "@/app/api/v1/todos/route"
import { POST as setTodoStatus } from "@/app/api/v1/todos/status/route"
import { GET as getCatalog } from "@/app/api/v1/catalog/route"
import { GET as getRecommendations } from "@/app/api/v1/coach/recommendations/route"
import { POST as adoptHabit } from "@/app/api/v1/habits/adopt/route"
import { POST as updateHabit } from "@/app/api/v1/habits/update/route"
import { POST as deleteHabit } from "@/app/api/v1/habits/delete/route"

/**
 * MCP tools are the /api/v1 handlers, called in-process with the token as an
 * ordinary Bearer header. Scopes, rate limits and validation therefore apply
 * exactly as they do to a ChatGPT action — there is one code path, not two.
 */

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response> | Response

const HANDLERS: Record<string, Handler> = {
  get_today: getSummary as Handler,
  log_habit: toggleCompletion as Handler,
  create_habit: createHabit as Handler,
  update_habit: updateHabit as Handler,
  delete_habit: deleteHabit as Handler,
  add_todo: postTodo as Handler,
  set_todo_status: setTodoStatus as Handler,
  list_todos: getTodos as Handler,
  get_stats: getStats as Handler,
  list_habits: getHabits as Handler,
  search_catalog: getCatalog as Handler,
  adopt_habit: adoptHabit as Handler,
  get_recommendations: getRecommendations as Handler,
}

export interface McpTool {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean }
  /** ChatGPT apps: every tool needs the user's sign-in. */
  securitySchemes: { type: "oauth2"; scopes: string[] }[]
}

function inputSchemaFor(op: ApiOperation): JsonSchema {
  const properties: Record<string, JsonSchema> = { ...(op.body?.properties ?? {}) }
  const required = [...(op.body?.required ?? [])]
  for (const p of op.params ?? []) {
    properties[p.name] = { ...p.schema, description: p.description }
    if (p.required) required.push(p.name)
  }
  return { type: "object", properties, ...(required.length ? { required } : {}) }
}

export const MCP_TOOLS: McpTool[] = API_OPERATIONS.map((op) => ({
  name: op.id,
  title: op.summary,
  description: op.description,
  inputSchema: inputSchemaFor(op),
  annotations: {
    readOnlyHint: op.method === "GET",
    destructiveHint: op.id === "delete_habit",
    idempotentHint: op.method === "GET" || ["log_habit", "create_habit", "update_habit", "delete_habit", "adopt_habit", "set_todo_status"].includes(op.id),
    openWorldHint: false,
  },
  securitySchemes: [{ type: "oauth2", scopes: ["habits"] }],
}))

export interface McpToolResult {
  content: { type: "text"; text: string }[]
  isError: boolean
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

  let body: string | undefined
  if (op.body) {
    const bodyKeys = Object.keys(op.body.properties ?? {})
    body = JSON.stringify(Object.fromEntries(bodyKeys.filter((k) => args[k] !== undefined).map((k) => [k, args[k]])))
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (typeof args.tz === "string") headers["X-Time-Zone"] = args.tz
  if (typeof args.timeZone === "string") headers["X-Time-Zone"] = args.timeZone

  const qs = query.toString()
  const request = new Request(`${origin}/api/v1${path}${qs ? `?${qs}` : ""}`, { method: op.method, headers, body })
  const response = await handler(request, { params: Promise.resolve(pathParams) })
  const text = await response.text()

  // Lead with the sentence to speak, when there is one, so a voice client can
  // answer without parsing the JSON below it.
  let say: string | null = null
  try {
    const parsed = JSON.parse(text) as { say?: unknown; message?: unknown }
    say = typeof parsed.say === "string" ? parsed.say : typeof parsed.message === "string" ? parsed.message : null
  } catch {
    // Markdown (get_today) or empty: send as-is.
  }
  const content: McpToolResult["content"] = say ? [{ type: "text", text: say }] : []
  content.push({ type: "text", text: text || `HTTP ${response.status}` })
  return { content, isError: response.status >= 400 }
}
