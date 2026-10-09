import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { getSiteSetting } from "@/lib/habits/oauth/store"
import { TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"

/**
 * GET /api/v1/integrations — public. What Settings and the docs show:
 * the connector URL, the public GPT link if the site owner set one up, and
 * how many tools the connector offers (with their version hash).
 */
export async function GET(request: Request) {
  const gptUrl = await getSiteSetting("chatgpt_gpt_url").catch(() => null)
  return NextResponse.json(
    { mcpUrl: `${requestOrigin(request)}/mcp`, gptUrl, toolCount: TOOL_COUNT, toolsVersion: TOOLS_VERSION },
    { headers: { "Cache-Control": "public, max-age=60" } }
  )
}
