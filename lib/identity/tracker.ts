import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { identity } from "./server"
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/habits/nostr/session-store"

function importedId(headers: Headers) {
  const raw = headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(SESSION_COOKIE_NAME + "="))?.slice(SESSION_COOKIE_NAME.length + 1)
  return raw && /^nses_[0-9a-f]{64}$/.test(raw) ? "nostr-" + hashSessionToken(raw) : null
}

export async function activeUser(id: string) {
  return prisma.authUser.findFirst({ where: { id, OR: [{ banned: false }, { banned: null }, { banExpires: { lte: new Date() } }] } })
}

export async function trackerIdentity(headers: Headers) {
  const managed = await identity().api.getSession({ headers })
  let id = managed?.user.id
  let imported: string | null = null
  if (!id) {
    imported = importedId(headers)
    if (!imported) return null
    const session = await prisma.authSession.findFirst({ where: { id: imported, expiresAt: { gt: new Date() } } })
    id = session?.userId
  }
  if (!id || !/^habit-\d+$/.test(id) || !await activeUser(id)) return null
  const tracker = await prisma.habitUser.findUnique({ where: { id: Number(id.slice(6)) }, select: { id: true, nostrPubkey: true, apiKey: true } })
  return tracker ? { tracker, imported, id } : null
}

export async function signedInResponse(request: Request, trackerId: number, body: object, imported?: string) {
  const userId = "habit-" + trackerId
  if (!await activeUser(userId)) return NextResponse.json({ error: "Account unavailable" }, { status: 403 })
  const response = await identity().api.trackerSignIn({ body: { userId, importedSession: imported }, headers: request.headers, asResponse: true })
  if (!response.ok) return NextResponse.json({ error: "Sign-in unavailable" }, { status: response.status })
  const result = NextResponse.json(body)
  result.cookies.delete(SESSION_COOKIE_NAME)
  for (const cookie of (response.headers as Headers & { getSetCookie(): string[] }).getSetCookie()) result.headers.append("set-cookie", cookie)
  return result
}

export async function managedSignOut(request: Request) {
  const imported = importedId(request.headers)
  if (imported) await prisma.authSession.deleteMany({ where: { id: imported } })
  const response = await identity().api.signOut({ headers: request.headers, asResponse: true })
  const result = NextResponse.json({ success: response.ok }, { status: response.status })
  result.cookies.delete(SESSION_COOKIE_NAME)
  for (const cookie of (response.headers as Headers & { getSetCookie(): string[] }).getSetCookie()) result.headers.append("set-cookie", cookie)
  return result
}
