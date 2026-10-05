import { redirectAllowed } from "./pkce"
import { getClient, type OAuthClient } from "./store"

export interface AuthorizeParams {
  response_type?: string | null
  client_id?: string | null
  redirect_uri?: string | null
  code_challenge?: string | null
  code_challenge_method?: string | null
  state?: string | null
  scope?: string | null
}

export type AuthorizeCheck =
  | { ok: true; client: OAuthClient; redirectUri: string; codeChallenge: string; state: string | null; scope: string | null }
  /** Can't trust redirect_uri: show the error on our page, never redirect. */
  | { ok: false; redirect: null; message: string }
  /** redirect_uri is trusted: send the error back to the client, per RFC 6749. */
  | { ok: false; redirect: string; message: string }

export function errorRedirect(redirectUri: string, error: string, state: string | null, description?: string): string {
  const url = new URL(redirectUri)
  url.searchParams.set("error", error)
  if (description) url.searchParams.set("error_description", description)
  if (state) url.searchParams.set("state", state)
  return url.toString()
}

export async function checkAuthorizeRequest(p: AuthorizeParams): Promise<AuthorizeCheck> {
  const client = p.client_id ? await getClient(p.client_id) : null
  if (!client) return { ok: false, redirect: null, message: "This app isn't registered. Remove the connector and add it again." }

  // A client with a single registered URI may omit it.
  const redirectUri = p.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : null)
  if (!redirectUri || !redirectAllowed(redirectUri, client.redirectUris, client.redirectPrefixes)) {
    return { ok: false, redirect: null, message: "The app asked to return to an address it didn't register." }
  }

  const state = p.state ?? null
  if (p.response_type !== "code") {
    return { ok: false, redirect: errorRedirect(redirectUri, "unsupported_response_type", state), message: "Unsupported response type" }
  }
  const challenge = p.code_challenge ?? ""
  if (challenge && p.code_challenge_method && p.code_challenge_method !== "S256") {
    return { ok: false, redirect: errorRedirect(redirectUri, "invalid_request", state, "Only S256 PKCE is supported"), message: "Bad PKCE method" }
  }
  // PKCE is mandatory for public clients (every dynamically registered one).
  if (!challenge && !client.confidential) {
    return { ok: false, redirect: errorRedirect(redirectUri, "invalid_request", state, "code_challenge is required"), message: "PKCE required" }
  }

  return { ok: true, client, redirectUri, codeChallenge: challenge, state, scope: p.scope ?? null }
}
