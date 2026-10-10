import { NextResponse } from "next/server"
import { verifyIntegrationTokenValue } from "@/lib/habits/integration-auth"
import { handleMcpPost, mcpMethodNotAllowed, rpcError } from "@/lib/habits/api/mcp-server"

/**
 * POST /api/mcp/<token> — the MCP server with the credential in the URL, for
 * clients that can't do OAuth. New setups use /mcp, which signs in instead.
 * Treat this URL as a password: never log it.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const user = await verifyIntegrationTokenValue(token)
  if (!user) {
    return NextResponse.json(rpcError(null, -32001, "Invalid or revoked connector URL. Reconnect from Settings → Voice assistants."), {
      status: 401,
    })
  }
  return handleMcpPost(request, token, user)
}

export const GET = mcpMethodNotAllowed
export const DELETE = mcpMethodNotAllowed
