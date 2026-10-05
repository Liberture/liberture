import { requestOrigin } from "@/lib/habits/api/assistant"
import { authorizationServerMetadata, corsJson, corsPreflight } from "@/lib/habits/oauth/metadata"

/** Same document for clients that only try OpenID discovery. No ID tokens are issued. */
export function GET(request: Request) {
  return corsJson(authorizationServerMetadata(requestOrigin(request)), { headers: { "Cache-Control": "public, max-age=3600" } })
}

export const OPTIONS = corsPreflight
