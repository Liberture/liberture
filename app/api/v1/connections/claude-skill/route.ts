import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { buildClaudeSkillZip } from "@/lib/habits/assistant-kit"
import { withTrackerOwner } from "@/lib/habits/api/with-tracker-owner"
import { createConnection } from "@/lib/habits/oauth/store"

/**
 * POST /api/v1/connections/claude-skill — download the Claude skill with its
 * own permanent token inside. Each download is a separate connection, listed
 * in Settings and revocable on its own, so it never disturbs other assistants.
 */
export const POST = withTrackerOwner(async (userId, request) => {
  const { accessToken } = await createConnection({ userId, name: "Claude skill", kind: "skill" })
  const zip = buildClaudeSkillZip({ baseUrl: requestOrigin(request), token: accessToken })
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="liberture-habits-skill.zip"',
      "Cache-Control": "no-store",
    },
  })
})
