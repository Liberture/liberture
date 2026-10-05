import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { buildOpenApiDocument } from "@/lib/habits/api/operations"

/**
 * GET /api/v1/openapi.json — public, no token.
 * Import this URL into a Custom GPT's Actions. The server URL follows the host
 * it was fetched from, so every deployment describes itself.
 */
export function GET(request: Request) {
  return NextResponse.json(buildOpenApiDocument(requestOrigin(request)), {
    headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" },
  })
}
