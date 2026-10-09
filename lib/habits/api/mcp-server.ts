import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { MCP_TOOLS, callMcpTool } from "@/lib/habits/api/mcp-tools"
import { MCP_RESOURCES, MCP_RESOURCE_TEMPLATES, readResource } from "@/lib/habits/api/mcp-resources"
import { MCP_PROMPTS, getPrompt } from "@/lib/habits/api/mcp-prompts"
import { completeArgument } from "@/lib/habits/api/mcp-completion"
import { SERVER_VERSION } from "@/lib/habits/api/operations"

/**
 * Model Context Protocol over Streamable HTTP: stateless, JSON responses.
 * Shared by /mcp (OAuth bearer, the URL people paste into Claude or ChatGPT)
 * and /api/mcp/<token> (token in the URL, older setups). Tools and resources
 * are the /api/v1 handlers (mcp-tools.ts, mcp-resources.ts), so the user's
 * permission scopes apply either way; prompts and completion are thin.
 *
 * Deliberately no SSE stream and no Mcp-Session-Id: nothing here is pushed
 * unprompted, and the one candidate (tools/list_changed when the user flips
 * a permission) isn't worth sessions — a switched-off tool still answers with
 * scope_disabled and a message to relay. So GET stays 405 and every list
 * advertises listChanged: false. A deploy that changes the tools changes
 * serverInfo.version instead (TOOLS_VERSION), and get_permissions reports the
 * count and version, so a stale client can be told to refresh.
 */

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]

const INSTRUCTIONS =
  "Liberture, the user's habit tracker, often used by voice. Be fast: call get_today once at the start, " +
  "then act in one call — every write tool (log_habit, log_habit_value, update_habit, archive_habit, update_todo, " +
  "set_todo_status, update_event, schedule_todo…) takes names as the user said them, so never list first. Amounts " +
  "(\"20 pushups\") go to log_habit_value; calendar times without an offset are the user's local time. Don't ask " +
  "follow-up questions when a default works (a new habit is daily with no reminder): do it, then read back the `say` " +
  "sentence the tool returns and offer to adjust. On 409 ask which of `options`. To stop a habit, archive it. Keep " +
  "replies to one or two sentences. When recommending, share infoUrl. If a tool returns scope_disabled, relay its " +
  "message; don't retry. If the user mentions something get_permissions says this connector offers (connector.tools) " +
  "but your tool list lacks it, tell them to refresh the Liberture connector in their assistant's settings. Before " +
  "any message the user didn't ask for (a scheduled check-in), call get_coach_state, then record_coach_nudge, and " +
  "only message them if it returns allowed."

interface JsonRpcRequest {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result }
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }
}

async function handleMessage(message: JsonRpcRequest, token: string, origin: string): Promise<object | null> {
  // Notifications (no id) get no response.
  const isNotification = message.id === undefined
  switch (message.method) {
    case "initialize": {
      const requested = typeof message.params?.protocolVersion === "string" ? message.params.protocolVersion : ""
      return rpcResult(message.id, {
        protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS[0],
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
          completions: {},
          logging: {},
        },
        // icons + websiteUrl (MCP 2025-11-25): clients that support them show
        // our logo for the connector instead of a generic one.
        serverInfo: {
          name: "liberture-habits",
          title: "Liberture",
          // 1.2.0+<hash of tool names and schemas>: changes with the tool list.
          version: SERVER_VERSION,
          websiteUrl: origin,
          icons: [
            { src: `${origin}/pwa-icon-512.png`, mimeType: "image/png", sizes: ["512x512"] },
            { src: `${origin}/pwa-icon-192.png`, mimeType: "image/png", sizes: ["192x192"] },
            { src: `${origin}/icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] },
          ],
        },
        instructions: INSTRUCTIONS,
      })
    }
    case "ping":
      return rpcResult(message.id, {})
    case "tools/list":
      // Everything fits in one page; no nextCursor.
      return rpcResult(message.id, { tools: MCP_TOOLS })
    case "resources/list":
      return rpcResult(message.id, { resources: MCP_RESOURCES })
    case "resources/templates/list":
      return rpcResult(message.id, { resourceTemplates: MCP_RESOURCE_TEMPLATES })
    case "resources/read": {
      const uri = message.params?.uri
      if (typeof uri !== "string") return rpcError(message.id, -32602, "Missing resource uri")
      const result = await readResource(uri, token, origin)
      return "error" in result ? rpcError(message.id, result.error.code, result.error.message) : rpcResult(message.id, result)
    }
    case "prompts/list":
      return rpcResult(message.id, { prompts: MCP_PROMPTS })
    case "prompts/get": {
      const name = message.params?.name
      const args = message.params?.arguments
      if (typeof name !== "string") return rpcError(message.id, -32602, "Missing prompt name")
      const prompt = getPrompt(name, args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {})
      return prompt ? rpcResult(message.id, prompt) : rpcError(message.id, -32602, `Unknown prompt: ${name}`)
    }
    case "completion/complete": {
      const ref = message.params?.ref
      const argument = message.params?.argument
      if (!ref || typeof ref !== "object" || !argument || typeof argument !== "object") {
        return rpcError(message.id, -32602, "completion/complete needs ref and argument")
      }
      return rpcResult(message.id, await completeArgument(ref as Record<string, unknown>, argument as Record<string, unknown>, token))
    }
    case "logging/setLevel":
      // Accepted so clients that set a level don't error; this server sends no log notifications.
      return rpcResult(message.id, {})
    case "tools/call": {
      const name = message.params?.name
      const args = message.params?.arguments
      if (typeof name !== "string") return rpcError(message.id, -32602, "Missing tool name")
      const result = await callMcpTool(
        name,
        args && typeof args === "object" && !Array.isArray(args) ? (args as Record<string, unknown>) : {},
        token,
        origin
      )
      if (!result) return rpcError(message.id, -32602, `Unknown tool: ${name}`)
      return rpcResult(message.id, result)
    }
    default:
      if (isNotification) return null
      return rpcError(message.id, -32601, `Method not found: ${message.method}`)
  }
}

/** Handle one POST once the caller's token is known to be valid. */
export async function handleMcpPost(request: Request, token: string): Promise<NextResponse> {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(rpcError(null, -32700, "Parse error"), { status: 400 })
  }

  const origin = requestOrigin(request)
  const messages = Array.isArray(payload) ? payload : [payload]
  const responses: object[] = []
  for (const message of messages) {
    if (!message || typeof message !== "object") {
      responses.push(rpcError(null, -32600, "Invalid request"))
      continue
    }
    const response = await handleMessage(message as JsonRpcRequest, token, origin)
    if (response) responses.push(response)
  }

  if (responses.length === 0) return new NextResponse(null, { status: 202 })
  return NextResponse.json(Array.isArray(payload) ? responses : responses[0], { headers: { "Cache-Control": "no-store" } })
}

/** No server-initiated stream: this server never sends anything unprompted. */
export function mcpMethodNotAllowed(): NextResponse {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } })
}

export { rpcError }
