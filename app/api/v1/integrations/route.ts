import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { getSiteSetting } from "@/lib/habits/oauth/store"

/**
 * GET /api/v1/integrations — public. What Settings and the docs show:
 * the connector URL, and the public GPT link if the site owner set one up.
 */
export async function GET(request: Request) {
  const gptUrl = await getSiteSetting("chatgpt_gpt_url").catch(() => null)
  return NextResponse.json(
    { mcpUrl: `${requestOrigin(request)}/mcp`, gptUrl },
    { headers: { "Cache-Control": "public, max-age=60" } }
  )
}
