import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { isAdminRequest } from "@/lib/habits/app-auth"
import { createStaticClient } from "@/lib/habits/oauth/store"

/**
 * POST /api/admin/oauth-clients — ADMIN_SECRET only.
 * Creates the confidential client a public Custom GPT's action uses to let
 * every ChatGPT user sign in with their own account. The secret is shown once.
 *
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" https://<host>/api/admin/oauth-clients
 */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { name?: unknown }
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "ChatGPT"
  const { client, clientSecret } = await createStaticClient(name, [
    "https://chatgpt.com/aip/",
    "https://chat.openai.com/aip/",
  ])
  const origin = requestOrigin(request)
  return NextResponse.json({
    client_id: client.clientId,
    client_secret: clientSecret,
    authorization_url: `${origin}/oauth/authorize`,
    token_url: `${origin}/oauth/token`,
    scope: "habits",
    token_exchange_method: "Default (POST request)",
    schema_url: `${origin}/api/v1/openapi.json`,
  })
}
