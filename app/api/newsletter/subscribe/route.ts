import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, clientIp } from "@/lib/habits/rate-limit"
import { verifyCaptcha } from "@/lib/newsletter/captcha"

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return new Response(null, { status: 415 })
  const origin = request.headers.get("origin")
  if (origin && new URL(request.url).origin !== origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) return new Response(null, { status: 403 })
  const limit = checkRateLimit("newsletter:" + clientIp(request), 5, 10 * 60_000)
  if (!limit.allowed) return new Response(null, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } })
  const reader = request.body?.getReader()
  if (!reader) return new Response(null, { status: 400 })
  let body
  try {
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) { await reader.cancel(); return new Response(null, { status: 413 }) }
      chunks.push(value)
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch { return new Response(null, { status: 400 }) }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof body?.token !== "string" || !body.token) {
    return new Response(null, { status: 400 })
  }
  try {
    if (!await verifyCaptcha(body.token)) return new Response(null, { status: 403 })
    // Existing subscriptions (including opt-outs) get the same public response.
    const existing = await prisma.newsletter.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } })
    if (!existing) await prisma.newsletter.createMany({ data: [{ id: randomUUID(), email, updatedAt: new Date() }], skipDuplicates: true })
    return new Response(null, { status: 204 })
  } catch { return new Response(null, { status: 503 }) }
}
