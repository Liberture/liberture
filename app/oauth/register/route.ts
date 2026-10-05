import { corsJson, corsPreflight } from "@/lib/habits/oauth/metadata"
import { isAcceptableRedirectUri } from "@/lib/habits/oauth/pkce"
import { registerClient } from "@/lib/habits/oauth/store"
import { checkRateLimit } from "@/lib/habits/rate-limit"

/**
 * POST /oauth/register — RFC 7591 dynamic client registration.
 * Claude and ChatGPT call this by themselves when a user adds the connector.
 * Registration grants nothing: every connection still needs the user to sign
 * in and approve on /oauth/authorize, which names the client and where it
 * sends them back to.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown"
  if (!checkRateLimit(`register:${ip}`, 20).allowed) {
    return corsJson({ error: "slow_down" }, { status: 429 })
  }

  let body: { client_name?: unknown; redirect_uris?: unknown }
  try {
    body = await request.json()
  } catch {
    return corsJson({ error: "invalid_client_metadata", error_description: "Body must be JSON" }, { status: 400 })
  }

  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u): u is string => typeof u === "string") : []
  if (redirectUris.length === 0 || redirectUris.length > 10 || !redirectUris.every(isAcceptableRedirectUri)) {
    return corsJson(
      { error: "invalid_redirect_uri", error_description: "redirect_uris must be https (or http on localhost) URLs" },
      { status: 400 }
    )
  }
  const name = typeof body.client_name === "string" && body.client_name.trim() ? body.client_name.trim().slice(0, 60) : "AI assistant"

  const client = await registerClient(name, redirectUris)
  return corsJson(
    {
      client_id: client.clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: client.name,
      redirect_uris: client.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  )
}

export const OPTIONS = corsPreflight
