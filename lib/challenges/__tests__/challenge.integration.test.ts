import { createECDH } from "node:crypto"
import { readFile } from "node:fs/promises"
import { nip19 } from "nostr-tools"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { POST as create, GET as list } from "@/app/api/challenges/route"
import { publicMatch } from "../server"
import { GET as backupRecipient } from "@/app/api/challenges/[id]/backup-recipient/route"
import { POST as register } from "@/app/api/challenges/moderator/route"
import { POST as invite } from "@/app/api/challenges/invite/route"
import { GET, PATCH } from "@/app/api/challenges/[id]/route"
import { getDb } from "@/lib/habits/db"
import { createNostrSessionsTable } from "@/lib/habits/db-migrate"
import { createSession, SESSION_COOKIE_NAME } from "@/lib/habits/nostr/session-store"
import type { ChallengeAction } from "../types"

const mint = vi.hoisted(() => ({ settle: vi.fn(async (_terms: unknown, p: string) => "receipt-" + p) }))
vi.mock("../cashu", () => ({
  TEST_MINT: "https://test.invalid",
  verifyDeposit: async () => {},
  depositProofIds: async (token: string) => [token],
  createPayoutPlan: async (_: unknown, depositor: string) => ({ depositor }),
  verifyPayoutSignature: () => true,
  settleDeposit: mint.settle,
}))

const testUrl = process.env.LIBERTURE_CHALLENGE_TEST_URL
const endpoint = "http://localhost/api/challenges"
const creator = { authorization: "Bearer ht_creator" }
const outsider = { authorization: "Bearer ht_outsider" }
const pubkey = () => { const key = createECDH("secp256k1"); key.generateKeys(); return key.getPublicKey("hex", "compressed") }
const modNostr = pubkey().slice(2)
const signature = "ab".repeat(64)

function req(method: string, path: string, headers: Record<string, string>, data?: unknown) {
  return new Request(endpoint + path, { method, headers: { "content-type": "application/json", ...headers }, body: data === undefined ? undefined : JSON.stringify(data) })
}
const apply = (id: string, headers: Record<string, string>, action: ChallengeAction) =>
  PATCH(req("PATCH", "/" + id, headers, action), { params: Promise.resolve({ id }) })
const make = () => create(req("POST", "", creator, {
  title: "Two weeks", rules: "Meet the agreed goal", stake: 10000, durationDays: 14,
  name: "A", pubkey: pubkey(), moderatorNpub: nip19.npubEncode(modNostr),
}))
const join = (token: string, headers: Record<string, string>, name: string) =>
  invite(req("POST", "/invite", headers, { token, name, pubkey: pubkey() }))

describe.skipIf(!testUrl)("private challenge routes", () => {
  let db: ReturnType<typeof getDb>
  let moderator: Record<string, string>
  beforeAll(async () => {
    const url = new URL(testUrl!)
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !/^\/liberture_challenge_test_[a-z0-9_]+$/.test(url.pathname)) throw Error("Expected disposable local test database")
    vi.stubEnv("DATABASE_URL", testUrl!)
    vi.stubEnv("LIBERTURE_MANAGED_AUTH", "false")
    db = getDb()
    await db`CREATE TABLE habit_users (id serial PRIMARY KEY, api_key text, nostr_pubkey text)`
    await db`INSERT INTO habit_users(api_key, nostr_pubkey) VALUES ('ht_creator', null), ('ht_outsider', null), ('ht_mod', ${modNostr})`
    await createNostrSessionsTable()
    moderator = { cookie: SESSION_COOKIE_NAME + "=" + await createSession(modNostr) }
    await db.unsafe(await readFile("prisma/migrations/20261113160000_tracker_challenges/migration.sql", "utf8"))
    await db.unsafe(await readFile("prisma/migrations/20261113180000_challenge_moderators/migration.sql", "utf8"))
    expect((await register(req("POST","/moderator",moderator,{name:"M",pubkey:pubkey()}))).status).toBe(200)
  })
  afterAll(async () => { if (db) await db.end(); vi.unstubAllEnvs() })

  async function ready() {
    const response = await make()
    expect(response.status).toBe(201)
    const { challenge, invites } = await response.json()
    const accepted = await join(invites.player, {}, "B")
    expect(accepted.status).toBe(200)
    const cookie = accepted.headers.get("set-cookie")!
    expect(cookie).toContain("HttpOnly")
    expect((await accepted.clone().json()).challenge.stage).toBe("funding")
    return { id: challenge.id as string, player: { cookie: cookie.split(";")[0] } }
  }
  it("locks in an offline moderator by npub and starts funding without their acceptance", async () => {
    const identity = pubkey().slice(2)
    const response = await create(req("POST","",creator,{title:"Offline referee",rules:"Walk",name:"A",pubkey:pubkey(),stake:10,durationDays:1,moderatorNpub:nip19.npubEncode(identity)}))
    expect(response.status).toBe(201)
    const {challenge, invites} = await response.json()
    expect(challenge.members.moderator.pubkey).toBe("02"+identity)
    expect((await (await join(invites.player,{},"B")).json()).challenge.stage).toBe("funding")
    await db`INSERT INTO habit_users(nostr_pubkey) VALUES (${identity})`
    const account = {cookie:SESSION_COOKIE_NAME+"="+await createSession(identity)}
    const result = await GET(req("GET","/"+challenge.id,account),{params:Promise.resolve({id:challenge.id})})
    expect((await result.json()).challenge.role).toBe("moderator")
    expect((await (await list(req("GET","",account))).json()).challenges.some((c:{id:string})=>c.id===challenge.id)).toBe(true)
  })
  it("exposes only spectator fields after the creator shares, and binds backup delivery to the member account", async () => {
    const { challenge, invites } = await (await make()).json()
    const params = {params:Promise.resolve({id:challenge.id})}
    expect(await publicMatch(challenge.id)).toBeNull()
    expect((await apply(challenge.id,moderator,{action:"publish"})).status).toBe(403)
    expect((await apply(challenge.id,creator,{action:"publish"})).status).toBe(200)
    expect(Object.keys((await publicMatch(challenge.id))!).sort()).toEqual(["title","rules","creator","player","stake","mint","durationDays","stage","result"].sort())
    const recipient = await backupRecipient(req("GET","",moderator),params)
    expect((await recipient.json()).recipient).toBe(modNostr)
    const guest = await join(invites.player,{},"Guest")
    const guestCookie = guest.headers.get("set-cookie")!.split(";")[0]
    expect((await backupRecipient(req("GET","",{cookie:guestCookie}),params)).status).toBe(403)
    expect((await publicMatch(challenge.id))?.player).toBe("Guest")
  })
  it("starts funding with two players when no moderator was selected", async () => {
    const {challenge, invites} = await (await create(req("POST","",creator,{title:"Two players",rules:"Walk",name:"A",pubkey:pubkey(),stake:10,durationDays:1}))).json()
    expect(challenge.arbitration).toBe("none")
    expect((await (await join(invites.player,{},"B")).json()).challenge.stage).toBe("funding")
    expect((await join(invites.moderator,{},"M")).status).toBe(404)
  })
  it("limits discovery and changes to members and validates identities on targeted invitations", async () => {
    expect((await list(req("GET", "", {}))).status).toBe(401)
    expect((await invite(req("POST", "/invite", { origin: "https://unrelated.example" }, {}))).status).toBe(403)
    const { invites, challenge } = await (await make()).json()
    const params = { params: Promise.resolve({ id: challenge.id }) }
    expect((await GET(req("GET", "/" + challenge.id, outsider), params)).status).toBe(404)
    expect((await (await list(req("GET", "", outsider))).json()).challenges).toEqual([])
    expect(challenge.members.moderator.name).toBe("M")
    expect((await join(invites.moderator, {}, "guest")).status).toBe(409)
    expect((await join(invites.moderator, outsider, "other")).status).toBe(409)
    expect((await join(invites.player, creator, "A again")).status).toBe(409)
    const rotated = await (await apply(challenge.id, creator, { action: "invite", role: "player" })).json()
    expect((await join(invites.player, {}, "B")).status).toBe(404)
    const simultaneous = await Promise.all([join(rotated.token, {}, "B"), join(rotated.token, {}, "C")])
    expect(simultaneous.map(r => r.status).sort()).toEqual([200, 409])
    const accepted = simultaneous.find(r => r.ok)!
    expect((await accepted.json()).challenge.invitedNpubs).toBeUndefined()
    const cookie = accepted.headers.get("set-cookie")!.split(";")[0]
    expect((await apply(challenge.id, { cookie }, { action: "invite", role: "moderator" })).status).toBe(403)
    const second = await (await make()).json()
    expect((await GET(req("GET", "/" + second.challenge.id, { cookie }), { params: Promise.resolve({ id: second.challenge.id }) })).status).toBe(404)
  })
  it("requires both deposits, enforces the moderator's disputed decision and retries a partially settled pot", async () => {
    const { id, player } = await ready()
    expect((await apply(id, creator, { action: "vote", result: "draw" })).status).toBe(409)
    expect((await apply(id, moderator, { action: "fund", token: "bad" })).status).toBe(403)
    expect((await apply(id, creator, { action: "fund", token: "first" })).status).toBe(200)
    expect((await apply(id, player, { action: "fund", token: "first" })).status).toBe(400)
    expect((await apply(id, player, { action: "fund", token: "second" })).status).toBe(200)
    expect((await apply(id, moderator, { action: "vote", result: "draw" })).status).toBe(403)
    expect((await apply(id, creator, { action: "vote", result: "player" })).status).toBe(200)
    expect((await apply(id, player, { action: "vote", result: "creator" })).status).toBe(200)
    expect((await apply(id, moderator, { action: "vote", result: "draw" })).status).toBe(200)
    expect((await apply(id, player, { action: "prepare" })).status).toBe(200)
    const sign = { action: "sign", signatures: { creator: signature, player: signature } } as const
    for (const headers of [creator, player]) expect((await apply(id, headers, sign)).status).toBe(200)
    expect((await apply(id, creator, { action: "settle" })).status).toBe(409)
    expect((await apply(id, moderator, sign)).status).toBe(200)
    mint.settle.mockResolvedValueOnce("receipt-creator").mockRejectedValueOnce(Error("Mint interrupted"))
    expect((await apply(id, creator, { action: "settle" })).status).toBe(503)
    const settled = await (await apply(id, player, { action: "settle" })).json()
    expect(settled.challenge.stage).toBe("settled")
    expect(settled.challenge.result).toBe("draw")
    expect(mint.settle.mock.calls.map(call => call[1])).toEqual(["creator", "player", "player"])
  })
  it("settles a mutually agreed winner with both players independently signing", async () => {
    const { id, player } = await ready()
    for (const [index, headers] of [creator, player].entries()) {
      expect((await apply(id, headers, { action: "fund", token: "agreed-" + index })).status).toBe(200)
    }
    for (const headers of [creator, player]) {
      expect((await apply(id, headers, { action: "vote", result: "player" })).status).toBe(200)
    }
    expect((await apply(id, creator, { action: "prepare" })).status).toBe(200)
    const sign = { action: "sign", signatures: { creator: signature, player: signature } } as const
    expect((await apply(id, moderator, sign)).status).toBe(409)
    expect((await apply(id, creator, sign)).status).toBe(200)
    expect((await apply(id, creator, { action: "settle" })).status).toBe(409)
    expect((await apply(id, player, sign)).status).toBe(200)
    const { challenge } = await (await apply(id, player, { action: "settle" })).json()
    expect(challenge.stage).toBe("settled")
    expect(challenge.result).toBe("player")
  })
  it("returns a lone deposit to its depositor after the deadline", async () => {
    const { id, player } = await ready()
    expect((await apply(id, creator, { action: "fund", token: "lonely" })).status).toBe(200)
    expect((await apply(id, creator, { action: "prepareRefund" })).status).toBe(409)
    await db`UPDATE tracker_challenges SET state=jsonb_set(state, '{expiresAt}', '1'::jsonb) WHERE id=${id}`
    expect((await apply(id, player, { action: "prepareRefund" })).status).toBe(409)
    expect((await apply(id, creator, { action: "prepareRefund" })).status).toBe(200)
    expect((await apply(id, creator, { action: "refund" })).status).toBe(409)
    expect((await apply(id, creator, { action: "signRefund", signature })).status).toBe(200)
    const refunded = await (await apply(id, creator, { action: "refund" })).json()
    expect(refunded.challenge.refunds.creator.receipt).toBe("receipt-creator")
  })
})
