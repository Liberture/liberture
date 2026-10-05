import { requestOrigin } from "@/lib/habits/api/assistant"
import { authorizationServerMetadata, corsJson, corsPreflight } from "@/lib/habits/oauth/metadata"

/** RFC 8414 metadata: how Claude and ChatGPT find our login and token endpoints. */
export function GET(request: Request) {
  return corsJson(authorizationServerMetadata(requestOrigin(request)), { headers: { "Cache-Control": "public, max-age=3600" } })
}

export const OPTIONS = corsPreflight
