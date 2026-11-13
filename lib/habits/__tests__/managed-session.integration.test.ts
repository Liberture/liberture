import { randomBytes } from "node:crypto"
import { execFileSync } from "node:child_process"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { finalizeEvent, generateSecretKey, getPublicKey } from "nostr-tools"
import { POST as login } from "@/app/api/auth/nostr/route"
import { GET as restore } from "@/app/api/auth/nostr/session/route"
import { POST as verifyKey } from "@/app/api/auth/verify/route"
import { GET as challenge } from "@/app/api/auth/nostr/challenge/route"
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/habits/nostr/session-store"
import { PUT as setPermissions } from "@/app/api/v1/auth/permissions/route"
import { POST as rotateToken } from "@/app/api/v1/auth/token/route"
import { POST as saveStorage } from "@/app/api/storage/route"
import { DELETE as disconnect } from "@/app/api/v1/connections/[id]/route"
import { saveSubscription, replaceSubscription, removeSubscription } from "@/lib/habits/push"
import { createConnection, listConnections } from "@/lib/habits/oauth/store"
import { identity } from "@/lib/identity/server"
import { getAuthFromRequest } from "@/lib/habits/app-auth"
import { prisma } from "@/lib/prisma"
import { getDb } from "@/lib/habits/db"

// Opt-in: requires a disposable database on localhost, with an explicit test prefix.
const url = process.env.LIBERTURE_AUTH_TEST_URL
const origin = "http://localhost:34787"
describe.skipIf(!url)("managed tracker sessions", () => {
  let sql: ReturnType<typeof postgres>
  const key = generateSecretKey()
  const pubkey = getPublicKey(key)
  const legacy = "nses_" + randomBytes(32).toString("hex")
  const apiKey = "ht_" + randomBytes(32).toString("hex")
  beforeAll(async () => {
    const target = new URL(url!)
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/^\/liberture_auth_test_[a-z0-9_]+$/.test(target.pathname)) throw Error("Expected disposable local database")
    Object.assign(process.env, { DATABASE_URL: url, LIBERTURE_MANAGED_AUTH: "true", BETTER_AUTH_URL: origin, APP_ORIGIN: origin, BETTER_AUTH_SECRET: randomBytes(48).toString("hex") })
    sql = postgres(url!, { max: 1 })
    await sql.unsafe(`CREATE TABLE habit_users (id serial primary key,api_key text unique not null,nostr_pubkey text unique,data jsonb,updated_at timestamp default now(),created_at timestamp default now());
      CREATE TABLE nostr_sessions (token text primary key,pubkey text not null,created_at timestamptz default now(),expires_at timestamptz);
      CREATE TABLE nostr_challenges (pubkey text primary key,nonce text not null,expires_at timestamptz)`)
    await sql`insert into habit_users(api_key,nostr_pubkey,data) values ('nostr_test',${pubkey},'{}'),(${apiKey},null,'{}')`
    await sql`insert into nostr_sessions(token,pubkey,expires_at) values (${hashSessionToken(legacy)},${pubkey},now()+interval '1 day')`
    execFileSync(process.execPath, ["scripts/migrate-managed-auth.mjs"], { stdio: "pipe" })
  })
  afterAll(async () => { await prisma.$disconnect(); if (sql) { await getDb().end(); await sql.end() } })

  function request(path: string, cookie = "") {
    return new Request(origin + path, { headers: { cookie, origin } })
  }
  function signedCookie(response: Response) {
    expect(response.status).toBe(200)
    const value = response.headers.get("set-cookie")?.match(/(?:^|,\s*)(better-auth\.session_token=[^;]+)/)?.[1]
    expect(value).toBeTruthy()
    return value!
  }
  it("scopes snapshot writes and connection removal to the authenticated account", async () => {
    const [owner] = await sql`SELECT id FROM habit_users WHERE api_key = ${apiKey}`
    const [other] = await sql`SELECT id, data FROM habit_users WHERE nostr_pubkey = ${pubkey}`
    const headers = { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" }
    const settings = origin + "/api/v1/auth/permissions"
    const patch = (permissions: Record<string, boolean>) => setPermissions(new Request(settings, {
      method: "PUT", headers, body: JSON.stringify({ permissions }),
    }))
    const changes = await Promise.all([patch({ calendar: false }), patch({ todos: false })])
    expect(changes.map(response => response.status)).toEqual([200, 200])
    const rotated = await rotateToken(new Request(origin + "/api/v1/auth/token", { method: "POST", headers }))
    expect(rotated.status).toBe(200)
    const { token } = await rotated.json()
    const assistant = await setPermissions(new Request(settings, { method: "PUT", headers: { Authorization: "Bearer " + token }, body: "{}" }))
    expect(assistant.status).toBe(401)
    const response = await saveStorage(new Request(origin + "/api/storage", {
      method: "POST", headers,
      body: JSON.stringify({ habits: [], todos: [], completions: [], schemaVersion: 7, projects: [{ id: "shared", name: "Project" }] }),
    }))
    expect(response.status).toBe(200)
    const [saved] = await sql`SELECT data FROM habit_users WHERE id = ${owner.id}`
    expect(saved.data.integrationPermissions).toMatchObject({ calendar: false, todos: false })
    expect(saved.data.integrationToken.hash).toHaveLength(64)
    expect((await sql`SELECT user_id FROM habit_projects WHERE id = 'shared'`).map(row => row.user_id)).toEqual([owner.id])
    expect((await sql`SELECT data FROM habit_users WHERE id = ${other.id}`)[0].data).toEqual(other.data)
    const device = { endpoint: "https://push.example.test/device", keys: { p256dh: "device-key", auth: "device-auth" } }
    expect(await saveSubscription(owner.id, device)).toBe(true)
    expect(await saveSubscription(other.id, device)).toBe(false)
    const second = { ...device, endpoint: "https://push.example.test/second" }
    expect(await saveSubscription(other.id, second)).toBe(true)
    expect(await replaceSubscription(second.endpoint, device)).toBeNull()
    expect(await removeSubscription(other.id, second.endpoint)).toBe(true)
    expect(await removeSubscription(other.id, device.endpoint)).toBe(false)
    expect(await removeSubscription(owner.id, device.endpoint)).toBe(true)
    const mine = await createConnection({ userId: owner.id, name: "Mine", kind: "skill" })
    const theirs = await createConnection({ userId: other.id, name: "Theirs", kind: "skill" })
    const remove = (id: string) => disconnect(new Request(origin + "/api/v1/connections/" + id, { method: "DELETE", headers }), { params: Promise.resolve({ id }) })
    expect((await remove(theirs.id)).status).toBe(404)
    expect((await remove(mine.id)).status).toBe(200)
    expect((await listConnections(other.id)).map(row => row.id)).toEqual([theirs.id])
  })

  it("adopts the original session, supports signed Nostr and legacy keys, and enforces admin revocation", async () => {
    const compat = SESSION_COOKIE_NAME + "=" + legacy
    const path = "/api/auth/nostr/session"
    const adopted = signedCookie(await restore(request(path, compat)))
    expect((await (await restore(request(path, adopted))).json()).pubkey).toBe(pubkey)
    expect((await restore(request(path, adopted + "bad"))).status).toBe(401)
    const nonce = (await (await challenge(request("/api/auth/nostr/challenge?pubkey=" + pubkey))).json()).challenge
    const signedEvent = finalizeEvent({ kind: 27235, created_at: Math.floor(Date.now()/1000), content: "", tags: [["u", origin+"/api/auth/nostr"], ["challenge", nonce], ["method", "POST"]] }, key)
    const newCookie = signedCookie(await login(new Request(origin+"/api/auth/nostr", { method: "POST", body: JSON.stringify({ pubkey, signedEvent }) })))
    expect((await getAuthFromRequest(request("/", newCookie)))?.pubkey).toBe(pubkey)
    const owner = await identity().api.getSession({ headers: request("/", newCookie).headers })
    const account = (await sql`SELECT id FROM "AuthUser" WHERE id <> ${owner!.user.id}`)[0]
    const verify = () => verifyKey(new Request(origin+"/api/auth/verify", { method: "POST", body: JSON.stringify({ apiKey }) }))
    const keyCookie = signedCookie(await verify())
    const adminHeaders = request("/", newCookie).headers
    const ban = () => identity().api.banUser({ headers: adminHeaders, body: { userId: account.id } })
    await expect(ban()).rejects.toThrow()
    await sql`UPDATE "AuthUser" SET role='admin' WHERE id=${owner!.user.id}`
    await ban()
    expect((await verify()).status).toBe(403)
    expect(await getAuthFromRequest(request("/", keyCookie))).toBeNull()
    await identity().api.revokeUserSessions({ headers: adminHeaders, body: { userId: owner!.user.id } })
    expect((await restore(request(path, compat))).status).toBe(401)
    expect((await restore(request(path, newCookie))).status).toBe(401)
  })
})
