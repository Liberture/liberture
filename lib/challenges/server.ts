import { createHash, ECDH, randomBytes, randomUUID } from "node:crypto"
import { nip19 } from "nostr-tools"
import { NextResponse } from "next/server"
import { z } from "zod"
import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { getDb } from "@/lib/habits/db"
import { checkRateLimit, clientIp } from "@/lib/habits/rate-limit"
import { LIVE_MINT, MAX_STAKE } from "./mints"
import type { Challenge, ChallengeStage, ChallengeTerms, Role } from "./types"

export const players = ["creator", "player"] as const
type State = Omit<Challenge, "stage" | "role">
export interface ChallengeRow {
  id: string
  creator_id: number
  player_id: number | null
  moderator_id: number | null
  player_invite: string
  moderator_invite: string
  player_guest: string | null
  moderator_guest: string | null
  player_nostr: string | null
  moderator_nostr: string | null
  state: State
}
export class ChallengeError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code) }
}
export function fail(code: string, status = 409): never { throw new ChallengeError(status, code) }
export function digest(value: string) { return createHash("sha256").update(value).digest("hex") }
const secret = () => randomBytes(32).toString("base64url")
export const epoch = () => Math.floor(Date.now() / 1000)
const privateHeaders = { "Cache-Control": "private, no-store" }
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: privateHeaders })

export async function serve(request: Request, run: () => Promise<Response>) {
  try {
    if (request.method !== "GET") {
      const origin = request.headers.get("origin")
      if ((origin && new URL(origin).host !== new URL(request.url).host && new URL(origin).host !== request.headers.get("host")) || request.headers.get("sec-fetch-site") === "cross-site") {
        return json({ error: "origin" }, 403)
      }
      if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "contentType" }, 415)
    }
    if (!process.env.DATABASE_URL) return json({ error: "databaseRequired" }, 503)
    return await run()
  } catch (error) {
    if (error instanceof ChallengeError) return json({ error: error.code }, error.status)
    if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ error: "invalidInput" }, 400)
    console.error("Challenge operation failed", error instanceof Error ? error.name : "error")
    return json({ error: "operationFailed" }, 500)
  }
}
export async function body(request: Request) {
  // Proof and signature operations have bounded payloads, including chunked bodies.
  const reader = request.body?.getReader()
  if (!reader) fail("invalidInput", 400)
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 131072) { await reader.cancel(); fail("tooLarge", 413) }
    chunks.push(value)
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}
export const memberSchema = z.object({
  name: z.string().trim().min(1).max(60),
  pubkey: z.string().regex(/^0[23][0-9a-f]{64}$/).refine(value => {
    try { ECDH.convertKey(value, "secp256k1", "hex", "hex", "compressed"); return true } catch { return false }
  }),
})
const inviteTarget = z.string().max(100).nullish().transform(value => {
  if (!value) return null
  try {
    const decoded = nip19.decode(value)
    if (decoded.type === "npub") return decoded.data
  } catch {}
  return fail("invalidNpub", 400)
})
const createSchema = memberSchema.extend({
  title: z.string().trim().min(1).max(100), rules: z.string().trim().min(1).max(2000),
  stake: z.number().int().min(1).max(MAX_STAKE), durationDays: z.number().int().min(1).max(90),
  playerNpub: inviteTarget, moderatorNpub: inviteTarget,
})

const cookieName = (id: string) => "challenge_" + id.replaceAll("-", "")
function guestDigest(request: Request, id: string) {
  const name = cookieName(id) + "="
  const match = request.headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(name))
  return match ? digest(match.slice(name.length)) : null
}
export function roleFor(row: ChallengeRow, request: Request, user: number | null): Role | null {
  if (user !== null) {
    if (row.creator_id === user) return "creator"
    if (row.player_id === user) return "player"
    if (row.moderator_id === user) return "moderator"
  }
  const guest = guestDigest(request, row.id)
  if (guest && guest === row.player_guest) return "player"
  if (guest && guest === row.moderator_guest) return "moderator"
  return null
}
export function stageOf(s: State): ChallengeStage {
  if (players.every(p => s.settlements[p]?.receipt)) return "settled"
  if (s.expiresAt && epoch() > s.expiresAt) return "expired"
  if (!s.members.player || (!s.members.moderator && s.arbitration !== "none")) return "inviting"
  if (!s.deposits.creator || !s.deposits.player) return "funding"
  if (s.result) return "settling"
  if (s.disputed) return "disputed"
  return "active"
}
export function view(state: State, role: Role): Challenge {
  const { invitedNpubs, ...publicState } = state
  return { ...publicState, ...(role === "creator" && { invitedNpubs }), role, stage: stageOf(state) }
}
export async function listChallenges(user: number) {
  const rows = await getDb()<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE creator_id=${user} OR player_id=${user} OR moderator_id=${user} ORDER BY state->>'createdAt' DESC`
  return rows.map(row => view(row.state, row.creator_id === user ? "creator" : row.player_id === user ? "player" : "moderator"))
}
export async function createChallenge(user: number, payload: unknown) {
  const args = createSchema.parse(payload)
  const db = getDb()
  const [creator] = await db`SELECT nostr_pubkey FROM habit_users WHERE id=${user}`
  const targets = [creator?.nostr_pubkey, args.playerNpub, args.moderatorNpub].filter(Boolean)
  if (new Set(targets).size !== targets.length) fail("duplicateMember", 400)
  const [moderator] = args.moderatorNpub ? await db`SELECT m.user_id,m.pubkey,m.name FROM tracker_challenge_moderators m
    JOIN habit_users u ON u.id=m.user_id WHERE u.nostr_pubkey=${args.moderatorNpub}` : []
  if (args.moderatorNpub && !moderator) fail("moderatorNotRegistered", 409)
  if (moderator?.pubkey.slice(2) === args.pubkey.slice(2)) fail("duplicateMember",400)
  const id = randomUUID()
  const invites = { player: secret(), moderator: secret() }
  const terms: ChallengeTerms = { id, title: args.title, rules: args.rules, stake: args.stake,
    durationDays: args.durationDays, mint: LIVE_MINT, createdAt: new Date().toISOString() }
  const state: State = { ...terms, arbitration: moderator ? "registered" : "none", members: { ...(moderator && {moderator:{name:moderator.name,pubkey:moderator.pubkey}}), creator: { name: args.name, pubkey: args.pubkey } },
    invitedNpubs: {
      ...(args.playerNpub && { player: nip19.npubEncode(args.playerNpub) }),
      ...(args.moderatorNpub && { moderator: nip19.npubEncode(args.moderatorNpub) }),
    }, deposits: {}, settlements: {}, refunds: {}, disputed: false, votes: {}, result: null, expiresAt: null, revision: 0 }
  await db`INSERT INTO tracker_challenges(id, creator_id, moderator_id, player_nostr, moderator_nostr, player_invite, moderator_invite, state)
    VALUES (${id}, ${user}, ${moderator?.user_id ?? null}, ${args.playerNpub}, ${args.moderatorNpub}, ${digest(invites.player)}, ${digest(invites.moderator)}, ${JSON.stringify(state)}::jsonb)`
  return { challenge: view(state, "creator"), invites }
}
const tokenSchema = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
export async function invite(request: Request) {
  if (!checkRateLimit("challengeInvite:" + clientIp(request), 120).allowed) fail("rateLimited", 429)
  const payload = await body(request)
  const { token } = tokenSchema.parse(payload)
  const hashed = digest(token)
  const joining = "name" in payload || "pubkey" in payload
  const member = joining ? memberSchema.parse(payload) : null
  const user = await verifiedTrackerUserId(request)
  const db = getDb()
  return db.begin(async tx => {
    const [row] = await tx<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE player_invite=${hashed} OR moderator_invite=${hashed} FOR UPDATE`
    if (!row) fail("inviteInvalid", 404)
    const role = row.player_invite === hashed ? "player" : "moderator"
    if (role === "moderator" && row.state.arbitration === "none") fail("inviteInvalid",404)
    const target = role === "player" ? row.player_nostr : row.moderator_nostr
    const existingRole = roleFor(row, request, user)
    const state = row.state
    const { id, title, rules, stake, durationDays, mint, createdAt } = state
    const preview = { id, title, rules, stake, durationDays, mint, createdAt, creator: state.members.creator!.name, requiresNostr: !!target, role }
    if (existingRole === role) return json({ invite: preview, challenge: view(state, role) })
    if (state.members[role]) fail("inviteClaimed")
    if (!member) return json({ invite: preview })
    if (existingRole || Object.values(state.members).some(m => m.pubkey.slice(2) === member.pubkey.slice(2))) fail("duplicateMember")
    if (target) {
      if (user === null) fail("nostrRequired", 401)
      const [owner] = await tx`SELECT nostr_pubkey FROM habit_users WHERE id=${user}`
      if (owner?.nostr_pubkey !== target) fail("wrongAccount", 403)
    }
    const guest = user === null ? secret() : null
    state.members[role] = member
    if (state.members.player && (state.members.moderator || state.arbitration === "none")) state.expiresAt ??= epoch() + state.durationDays * 86400
    state.revision++
    await tx`UPDATE tracker_challenges SET ${tx(role + "_id")}=${user}, ${tx(role + "_guest")}=${guest ? digest(guest) : null}, state=${JSON.stringify(state)}::jsonb WHERE id=${id}`
    const response = json({ challenge: view(state, role), invite: preview })
    if (guest) response.cookies.set(cookieName(id), guest, { httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production", path: "/api/challenges", maxAge: 365 * 86400 })
    return response
  })
}
export async function access(request: Request, id: string) {
  if (!z.uuid().safeParse(id).success) fail("notFound", 404)
  const user = await verifiedTrackerUserId(request)
  const db = getDb()
  const [row] = await db<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE id=${id}`
  const role = row && roleFor(row, request, user)
  if (!role) fail("notFound", 404)
  return { row, role }
}
export async function rotateInvite(id: string, role: Role, target: "player" | "moderator") {
  if (role !== "creator") fail("forbidden", 403)
  const token = secret()
  const db = getDb()
  const [row] = await db<ChallengeRow[]>`UPDATE tracker_challenges SET ${db(target + "_invite")}=${digest(token)}
    WHERE id=${id} AND NOT ((state->'members') ? ${target}) AND (${target} <> 'moderator' OR state->>'arbitration' IS DISTINCT FROM 'none') RETURNING *`
  if (!row) fail("inviteClaimed")
  return { challenge: view(row.state, role), token }
}
