import { NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/habits/app-auth"
import { getSiteSetting, setSiteSetting } from "@/lib/habits/oauth/store"

/**
 * GET/PUT /api/admin/site-settings — ADMIN_SECRET only. Send only the keys to
 * change; null clears one.
 *
 *   chatgptAppUrl        https://chatgpt.com/… link to the published app or GPT;
 *                        Settings and the docs show an "Open in ChatGPT" button
 *   openaiAppsChallenge  token for /.well-known/openai-apps-challenge
 *   contactEmail         shown on /privacy, /terms and /support
 */
const KEYS = {
  chatgptAppUrl: "chatgpt_gpt_url",
  openaiAppsChallenge: "openai_apps_challenge",
  contactEmail: "contact_email",
} as const

function valid(key: keyof typeof KEYS, value: string): boolean {
  if (key === "chatgptAppUrl") return /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(value)
  if (key === "contactEmail") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  return /^[A-Za-z0-9._~+/=-]{8,512}$/.test(value)
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const entries = await Promise.all(Object.entries(KEYS).map(async ([k, dbKey]) => [k, await getSiteSetting(dbKey)]))
  return NextResponse.json(Object.fromEntries(entries))
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  for (const key of Object.keys(KEYS) as (keyof typeof KEYS)[]) {
    if (!(key in body)) continue
    const value = body[key]
    if (value !== null && (typeof value !== "string" || !valid(key, value.trim()))) {
      return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 })
    }
    await setSiteSetting(KEYS[key], value === null ? null : (value as string).trim())
  }
  return GET(request)
}
