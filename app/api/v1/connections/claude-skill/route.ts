import { NextResponse } from "next/server"
import { requestOrigin } from "@/lib/habits/api/assistant"
import { buildClaudeSkillZip } from "@/lib/habits/assistant-kit"
import { verifyApiKey } from "@/lib/habits/integration-auth"
import { createConnection } from "@/lib/habits/oauth/store"

/**
 * POST /api/v1/connections/claude-skill — download the Claude skill with its
 * own permanent token inside. Each download is a separate connection, listed
 * in Settings and revocable on its own, so it never disturbs other assistants.
 */
export async function POST(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { accessToken } = await createConnection({ userId: user.userId, name: "Claude skill", kind: "skill" })
  const zip = buildClaudeSkillZip({ baseUrl: requestOrigin(request), token: accessToken })
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="liberture-habits-skill.zip"',
      "Cache-Control": "no-store",
    },
  })
}
