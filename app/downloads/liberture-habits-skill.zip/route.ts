import { NextResponse } from "next/server"
import { buildClaudeSkillZip } from "@/lib/habits/assistant-kit"
import { requestOrigin } from "@/lib/habits/api/assistant"

/**
 * GET /downloads/liberture-habits-skill.zip — the generic skill, no token.
 * Uses the connector if present; the script reads LIBERTURE_HABITS_TOKEN.
 * Most people want the personal one from their setup link instead.
 */
export function GET(request: Request) {
  const zip = buildClaudeSkillZip({ baseUrl: requestOrigin(request), token: null })
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="liberture-habits-skill.zip"',
      "Cache-Control": "public, max-age=300",
    },
  })
}
