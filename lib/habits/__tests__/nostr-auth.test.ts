import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { finalizeEvent, generateSecretKey, getPublicKey } from "nostr-tools"

/**
 * Regressions for the 2026-10-26 Nostr sign-in review: the NIP-98 `u` tag binds
 * a login to this site, a challenge is consumed once (atomically) and can't be
 * overwritten by others, and the session token lives only in the httpOnly
 * cookie, stored hashed.
 */

// In-memory stand-in for the few tables sign-in touches. Every query yields to
// the event loop first, so two concurrent requests interleave like they would
// against Postgres.
const db = vi.hoisted(() => ({
  challenges: new Map<string, { nonce: string; expiresAt: Date }>(),
  sessions: new Map<string, { pubkey: string; expiresAt: Date }>(),
  users: [] as { id: number; nostr_pubkey: string; created_at: Date }[],
}))

vi.mock("@/lib/habits/db", () => {
  const run = (q: string, v: unknown[]): Record<string, unknown>[] => {
    const now = new Date()
    if (q.startsWith("DELETE FROM nostr_challenges WHERE expires_at < NOW()")) {
      for (const [k, c] of db.challenges) if (c.expiresAt < now) db.challenges.delete(k)
      return []
    }
    if (q.startsWith("INSERT INTO nostr_challenges")) {
      const [pubkey, nonce, expiresAt] = v as [string, string, Date]
      const current = db.challenges.get(pubkey)
      const kept = current && current.expiresAt > now ? current.nonce : nonce
      db.challenges.set(pubkey, { nonce: kept, expiresAt })
      return [{ nonce: kept }]
    }
    if (q.startsWith("DELETE FROM nostr_challenges WHERE pubkey = $ AND nonce = $ AND expires_at > NOW()")) {
      const [pubkey, nonce] = v as [string, string]
      const c = db.challenges.get(pubkey)
      if (!c || c.nonce !== nonce || c.expiresAt <= now) return []
      db.challenges.delete(pubkey)
      return [{ pubkey }]
    }
    if (q.startsWith("SELECT id, created_at FROM habit_users WHERE nostr_pubkey = $")) {
      return db.users.filter((u) => u.nostr_pubkey === v[0])
    }
    if (q.startsWith("SELECT id, api_key, nostr_pubkey, data FROM habit_users WHERE nostr_pubkey = $")) {
      return db.users.filter((u) => u.nostr_pubkey === v[0]).map((u) => ({ ...u, api_key: "nostr_internal", data: {} }))
    }
    if (q.startsWith("INSERT INTO habit_users")) {
      db.users.push({ id: db.users.length + 1, nostr_pubkey: v[1] as string, created_at: now })
      return []
    }
    if (q.startsWith("DELETE FROM nostr_sessions WHERE pubkey = $")) {
      for (const [k, s] of db.sessions) if (s.pubkey === v[0]) db.sessions.delete(k)
      return []
    }
    if (q.startsWith("INSERT INTO nostr_sessions")) {
      const [pubkey, token, expiresAt] = v as [string, string, Date]
      db.sessions.set(token, { pubkey, expiresAt })
      return []
    }
    if (q.startsWith("SELECT pubkey, expires_at FROM nostr_sessions WHERE token = $")) {
      const s = db.sessions.get(v[0] as string)
      return s ? [{ pubkey: s.pubkey, expires_at: s.expiresAt }] : []
    }
    if (q.startsWith("UPDATE nostr_sessions SET expires_at = $")) {
      const s = db.sessions.get(v[1] as string)
      if (!s) return []
      s.expiresAt = v[0] as Date
      return [{ pubkey: s.pubkey }]
    }
    return [] // DDL and anything this test doesn't model
  }
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) =>
    new Promise<Record<string, unknown>[]>((resolve) =>
      setImmediate(() => resolve(run(strings.join("$").replace(/\s+/g, " ").trim(), values)))
    )
  return { getDb: () => sql }
})
vi.mock("@/lib/habits/local-storage", () => ({ isLocalStorageMode: () => false, getLocalUser: vi.fn() }))

import { POST as login } from "@/app/api/auth/nostr/route"
import { GET as challengeFor } from "@/app/api/auth/nostr/challenge/route"
import { GET as sessionGet } from "@/app/api/auth/nostr/session/route"
import { checkAuthEvent } from "@/lib/habits/nostr/auth-event"
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/habits/nostr/session-store"
import { verifyApiKey } from "@/lib/habits/integration-auth"

const ORIGIN = "https://liberture.test"
let ipCounter = 0
const freshIp = () => `203.0.113.${++ipCounter}`

function newKey() {
  const sk = generateSecretKey()
  return { sk, pubkey: getPublicKey(sk) }
}

function loginEvent(
  sk: Uint8Array,
  challenge: string,
  { u = `${ORIGIN}/api/auth/nostr`, method = "POST" }: { u?: string | null; method?: string } = {}
) {
  const tags = [...(u === null ? [] : [["u", u]]), ["method", method], ["challenge", challenge]]
  return finalizeEvent({ kind: 27235, created_at: Math.floor(Date.now() / 1000), tags, content: "" }, sk)
}

async function getChallenge(pubkey: string): Promise<string> {
  const res = await challengeFor(
    new Request(`${ORIGIN}/api/auth/nostr/challenge?pubkey=${pubkey}`, { headers: { "cf-connecting-ip": freshIp() } })
  )
  expect(res.status).toBe(200)
  return (await res.json()).challenge
}

function postLogin(pubkey: string, signedEvent: unknown, ip = freshIp()) {
  return login(
    new Request(`${ORIGIN}/api/auth/nostr`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "cf-connecting-ip": ip },
      body: JSON.stringify({ pubkey, signedEvent }),
    })
  )
}

function sessionCookie(res: Response): string | null {
  const header = res.headers.get("set-cookie") ?? ""
  const match = new RegExp(`${SESSION_COOKIE_NAME}=([^;]*)`).exec(header)
  return match ? match[1] : null
}

beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", ORIGIN)
  db.challenges.clear()
  db.sessions.clear()
  db.users.length = 0
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe("POST /api/auth/nostr", () => {
  it("signs in with a valid event: the token is only in the cookie, and stored hashed", async () => {
    const { sk, pubkey } = newKey()
    const res = await postLogin(pubkey, loginEvent(sk, await getChallenge(pubkey)))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ created: true })
    expect(body).not.toHaveProperty("sessionToken")

    const token = sessionCookie(res)
    expect(token).toMatch(/^nses_[0-9a-f]{64}$/)
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/i)
    expect(db.sessions.has(token!)).toBe(false)
    expect(db.sessions.get(hashSessionToken(token!))?.pubkey).toBe(pubkey)
  })

  it("refuses a signature collected on another site (u tag names that site)", async () => {
    const { sk, pubkey } = newKey()
    const relayed = loginEvent(sk, await getChallenge(pubkey), { u: "https://evil.example/api/auth/nostr" })
    const res = await postLogin(pubkey, relayed)

    expect(res.status).toBe(401)
    expect(sessionCookie(res)).toBeNull()
    expect(db.sessions.size).toBe(0)
  })

  it("refuses an event without a u tag, or one signed for another method", async () => {
    const { sk, pubkey } = newKey()
    expect((await postLogin(pubkey, loginEvent(sk, await getChallenge(pubkey), { u: null }))).status).toBe(401)
    expect((await postLogin(pubkey, loginEvent(sk, await getChallenge(pubkey), { method: "GET" }))).status).toBe(401)
  })

  it("refuses an event signed by a different key than the claimed pubkey", async () => {
    const victim = newKey()
    const attacker = newKey()
    const res = await postLogin(victim.pubkey, loginEvent(attacker.sk, await getChallenge(victim.pubkey)))
    expect(res.status).toBe(401)
  })

  it("accepts a signed event once, even when it is sent twice at the same time", async () => {
    const { sk, pubkey } = newKey()
    const event = loginEvent(sk, await getChallenge(pubkey))
    const [a, b] = await Promise.all([postLogin(pubkey, event), postLogin(pubkey, event)])

    expect([a.status, b.status].sort()).toEqual([200, 401])
    expect((await postLogin(pubkey, event)).status).toBe(401)
  })

  it("limits sign-in attempts per client", async () => {
    const ip = freshIp()
    for (let i = 0; i < 20; i++) expect((await postLogin("x", {}, ip)).status).toBe(400)
    const limited = await postLogin("x", {}, ip)
    expect(limited.status).toBe(429)
    expect((await postLogin("x", {}, freshIp())).status).toBe(400)
  })
})

describe("GET /api/auth/nostr/challenge", () => {
  it("never replaces a pending challenge, which anyone may request for any pubkey", async () => {
    const { sk, pubkey } = newKey()
    const mine = await getChallenge(pubkey)
    const someoneElses = await getChallenge(pubkey)
    expect(someoneElses).toBe(mine)

    expect((await postLogin(pubkey, loginEvent(sk, mine))).status).toBe(200)
    expect(await getChallenge(pubkey)).not.toBe(mine)
  })
})

describe("session token outside the cookie", () => {
  async function signedInToken() {
    const { sk, pubkey } = newKey()
    const res = await postLogin(pubkey, loginEvent(sk, await getChallenge(pubkey)))
    return { pubkey, token: sessionCookie(res)! }
  }

  it("GET /api/auth/nostr/session reads only the cookie, and never sets one from ?token=", async () => {
    const { pubkey, token } = await signedInToken()

    const viaQuery = await sessionGet(new Request(`${ORIGIN}/api/auth/nostr/session?token=${token}`))
    expect(viaQuery.status).toBe(401)
    expect(sessionCookie(viaQuery)).toBeNull()

    const viaCookie = await sessionGet(
      new Request(`${ORIGIN}/api/auth/nostr/session`, { headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } })
    )
    expect(viaCookie.status).toBe(200)
    expect((await viaCookie.json()).pubkey).toBe(pubkey)
  })

  it("owner endpoints (verifyApiKey) ignore ?token=", async () => {
    const { pubkey, token } = await signedInToken()
    expect(await verifyApiKey(new Request(`${ORIGIN}/api/v1/connections?token=${token}`))).toBeNull()
    const viaCookie = await verifyApiKey(
      new Request(`${ORIGIN}/api/v1/connections`, { headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } })
    )
    expect(viaCookie?.nostrPubkey).toBe(pubkey)
  })
})

describe("checkAuthEvent origins", () => {
  const { sk, pubkey } = newKey()
  const challenge = "a".repeat(64)
  const check = (u: string) => checkAuthEvent(loginEvent(sk, challenge, { u }), pubkey, "/api/auth/nostr")

  it("defaults to liberture.com in production, never trusting request headers", () => {
    vi.stubEnv("APP_ORIGIN", "")
    vi.stubEnv("NODE_ENV", "production")
    expect(check("https://liberture.com/api/auth/nostr").valid).toBe(true)
    expect(check("https://www.liberture.com/api/auth/nostr/").valid).toBe(true)
    expect(check("http://localhost:3000/api/auth/nostr").valid).toBe(false)
    expect(check("https://liberture.com.evil.example/api/auth/nostr").valid).toBe(false)
    expect(check("https://liberture.com/api/auth/nostr/migrate").valid).toBe(false)
  })

  it("allows only localhost in development", () => {
    vi.stubEnv("APP_ORIGIN", "")
    vi.stubEnv("NODE_ENV", "development")
    expect(check("http://localhost:3000/api/auth/nostr").valid).toBe(true)
    expect(check("https://liberture.com/api/auth/nostr").valid).toBe(false)
  })
})
