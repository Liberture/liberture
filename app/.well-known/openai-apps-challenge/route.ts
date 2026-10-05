import { NextResponse } from "next/server"
import { getSiteSetting } from "@/lib/habits/oauth/store"

/**
 * OpenAI's domain check for the ChatGPT app submission: the token the
 * developer dashboard shows, as plain text. Set it with
 * PUT /api/admin/site-settings {"openaiAppsChallenge": "<token>"}.
 */
export async function GET() {
  const token = await getSiteSetting("openai_apps_challenge").catch(() => null)
  if (!token) return new NextResponse("Not configured\n", { status: 404, headers: { "Content-Type": "text/plain" } })
  return new NextResponse(token, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
}
