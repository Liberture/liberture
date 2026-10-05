import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { handleMcpPost, rpcError } from "@/lib/habits/api/mcp-server"
import { verifyIntegrationTokenValue } from "@/lib/habits/integration-auth"
import { CORS_HEADERS } from "@/lib/habits/oauth/metadata"

/**
 * /mcp — the one URL people paste into Claude or ChatGPT. Unauthenticated
 * requests get 401 with a pointer to our OAuth metadata, which is what makes
 * the app open our sign-in-and-approve page; after that it sends the access
 * token as a Bearer header for good.
 */
function unauthorized(request: Request, invalid: boolean): NextResponse {
  const metadata = `${requestOrigin(request)}/.well-known/oauth-protected-resource/mcp`
  const challenge = `Bearer resource_metadata="${metadata}"${invalid ? ', error="invalid_token"' : ""}`
  return NextResponse.json(rpcError(null, -32001, "Sign in required: connect Liberture from your assistant's connector settings."), {
    status: 401,
    headers: { ...CORS_HEADERS, "WWW-Authenticate": challenge, "Access-Control-Expose-Headers": "WWW-Authenticate" },
  })
}

function bearer(request: Request): string | null {
  const auth = request.headers.get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
}

export async function POST(request: Request) {
  const token = bearer(request)
  if (!token) return unauthorized(request, false)
  const user = await verifyIntegrationTokenValue(token)
  if (!user) return unauthorized(request, true)
  const response = await handleMcpPost(request, token)
  for (const [k, v] of Object.entries(CORS_HEADERS)) response.headers.set(k, v)
  return response
}

export async function GET(request: Request) {
  if (!bearer(request)) return unauthorized(request, false)
  return new NextResponse(null, { status: 405, headers: { Allow: "POST", ...CORS_HEADERS } })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
