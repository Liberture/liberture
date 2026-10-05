import { NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { checkAuthorizeRequest, errorRedirect, type AuthorizeParams } from "@/lib/habits/oauth/authorize"
import { createAuthCode } from "@/lib/habits/oauth/store"
import { requestOrigin } from "@/lib/habits/api/assistant"

/**
 * POST /api/oauth/approve — the consent page's Approve / Cancel.
 * Body: the original /oauth/authorize parameters plus { decision }.
 * Requires the signed-in owner (ht_ key or Nostr session); answers with the
 * URL to send the browser back to the assistant.
 */
export async function POST(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 })

  let body: AuthorizeParams & { decision?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const check = await checkAuthorizeRequest(body)
  if (!check.ok) {
    console.warn(`[oauth/approve] rejected: ${check.message}`)
    return check.redirect
      ? NextResponse.json({ redirect: check.redirect })
      : NextResponse.json({ error: check.message }, { status: 400 })
  }

  if (body.decision !== "approve") {
    return NextResponse.json({ redirect: errorRedirect(check.redirectUri, "access_denied", check.state, "The user declined") })
  }

  const code = await createAuthCode({
    clientId: check.client.clientId,
    userId: user.userId,
    redirectUri: check.redirectUri,
    codeChallenge: check.codeChallenge,
    scope: check.scope,
  })
  console.info(`[oauth/approve] ${check.client.name} approved, returning to ${new URL(check.redirectUri).host}`)
  const url = new URL(check.redirectUri)
  url.searchParams.set("code", code)
  if (check.state) url.searchParams.set("state", check.state)
  url.searchParams.set("iss", requestOrigin(request))
  return NextResponse.json({ redirect: url.toString() })
}
