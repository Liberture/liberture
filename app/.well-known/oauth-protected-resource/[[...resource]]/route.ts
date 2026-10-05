import { requestOrigin } from "@/lib/habits/api/assistant"
import { corsJson, corsPreflight, protectedResourceMetadata } from "@/lib/habits/oauth/metadata"

/**
 * RFC 9728 metadata for /mcp, at both the root path and the
 * resource-suffixed one (/.well-known/oauth-protected-resource/mcp).
 */
export function GET(request: Request) {
  return corsJson(protectedResourceMetadata(requestOrigin(request)), { headers: { "Cache-Control": "public, max-age=3600" } })
}

export const OPTIONS = corsPreflight
