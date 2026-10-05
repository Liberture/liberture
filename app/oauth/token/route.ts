import { corsJson, corsPreflight, OAUTH_SCOPE } from "@/lib/habits/oauth/metadata"
import { verifyPkce } from "@/lib/habits/oauth/pkce"
import { clientSecretMatches, consumeAuthCode, createConnection, getClient, refreshConnection } from "@/lib/habits/oauth/store"

/**
 * POST /oauth/token — authorization_code (with PKCE) and refresh_token grants.
 * Tokens don't expire: the connection lasts until the user disconnects it in
 * Settings → Voice assistants. Refresh is supported for clients that insist.
 */
async function readParams(request: Request): Promise<URLSearchParams> {
  const type = request.headers.get("content-type") ?? ""
  if (type.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<string, unknown>
    return new URLSearchParams(Object.entries(json).map(([k, v]) => [k, String(v)]))
  }
  return new URLSearchParams(await request.text())
}

function clientCredentials(request: Request, params: URLSearchParams): { id: string | null; secret: string | null } {
  const basic = request.headers.get("authorization")
  if (basic?.startsWith("Basic ")) {
    const decoded = Buffer.from(basic.slice(6), "base64").toString("utf8")
    const i = decoded.indexOf(":")
    if (i > 0) return { id: decodeURIComponent(decoded.slice(0, i)), secret: decodeURIComponent(decoded.slice(i + 1)) }
  }
  let id = params.get("client_id")
  // private_key_jwt clients (ChatGPT can be one) may send only an assertion;
  // its iss names the client. Not verified: we don't advertise that method,
  // and the code is bound by PKCE, which is what actually protects it.
  const assertion = params.get("client_assertion")
  if (!id && assertion) {
    try {
      const payload = JSON.parse(Buffer.from(assertion.split(".")[1] ?? "", "base64url").toString("utf8")) as { iss?: unknown }
      if (typeof payload.iss === "string") id = payload.iss
    } catch {
      // Fall through to "client_id is required".
    }
  }
  return { id, secret: params.get("client_secret") }
}

function fail(error: string, description: string, status = 400) {
  // Logged without codes or tokens: enough to tell which step a client tripped on.
  console.warn(`[oauth/token] ${status} ${error}: ${description}`)
  return corsJson({ error, error_description: description }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const params = await readParams(request)
  const creds = clientCredentials(request, params)
  if (!creds.id) return fail("invalid_client", "client_id is required", 401)
  const client = await getClient(creds.id)
  if (!client || !clientSecretMatches(client, creds.secret)) return fail("invalid_client", "Unknown client or wrong secret", 401)

  const grant = params.get("grant_type")

  if (grant === "authorization_code") {
    const code = params.get("code")
    if (!code) return fail("invalid_request", "code is required")
    const stored = await consumeAuthCode(code)
    if (!stored || stored.clientId !== client.clientId) return fail("invalid_grant", "Code is invalid, expired or already used")
    if (params.get("redirect_uri") && params.get("redirect_uri") !== stored.redirectUri) {
      return fail("invalid_grant", "redirect_uri does not match")
    }
    if (stored.codeChallenge) {
      const verifier = params.get("code_verifier")
      if (!verifier || !verifyPkce(verifier, stored.codeChallenge)) return fail("invalid_grant", "PKCE verification failed")
    }

    console.info(`[oauth/token] issued for client ${client.name}`)
    const tokens = await createConnection({ userId: stored.userId, name: client.name, kind: "oauth", clientId: client.clientId, withRefresh: true })
    return corsJson(
      { access_token: tokens.accessToken, token_type: "Bearer", refresh_token: tokens.refreshToken, scope: OAUTH_SCOPE },
      { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
    )
  }

  if (grant === "refresh_token") {
    const refreshToken = params.get("refresh_token")
    if (!refreshToken) return fail("invalid_request", "refresh_token is required")
    const accessToken = await refreshConnection(refreshToken, client.clientId)
    if (!accessToken) return fail("invalid_grant", "Refresh token is invalid or was disconnected")
    return corsJson(
      { access_token: accessToken, token_type: "Bearer", refresh_token: refreshToken, scope: OAUTH_SCOPE },
      { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
    )
  }

  return fail("unsupported_grant_type", "Use authorization_code or refresh_token")
}

export const OPTIONS = corsPreflight
