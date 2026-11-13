import { z } from "zod"
import { getDb } from "@/lib/habits/db"
import { createPayoutPlan, depositProofIds, settleDeposit, verifyDeposit, verifyPayoutSignature } from "./cashu"
import type { CashuTerms } from "./cashu"
import { epoch, fail, players, rotateInvite, stageOf, view, type ChallengeRow } from "./server"
import type { ChallengeSettlement, Player, Role } from "./types"

type State = ChallengeRow["state"]
const verdict = z.enum(["creator", "player", "draw"])
const signature = z.string().regex(/^[0-9a-f]{128}$/)
const actions = z.discriminatedUnion("action", [
  z.object({ action: z.literal("invite"), role: z.enum(["player", "moderator"]) }),
  z.object({ action: z.literal("fund"), token: z.string().min(1).max(120000) }),
  z.object({ action: z.literal("vote"), result: verdict }),
  z.object({ action: z.literal("dispute") }),
  z.object({ action: z.literal("prepare") }),
  z.object({ action: z.literal("sign"), signatures: z.object({ creator: signature, player: signature }) }),
  z.object({ action: z.literal("settle") }),
  z.object({ action: z.literal("prepareRefund") }),
  z.object({ action: z.literal("signRefund"), signature }),
  z.object({ action: z.literal("refund") }),
])
function terms(s: State): CashuTerms {
  if (!s.expiresAt || !s.members.creator || !s.members.player || (!s.members.moderator && s.arbitration !== "none")) fail("stateChanged")
  return { mint: s.mint, id: s.id, stake: s.stake, refundAt: s.expiresAt, keys: {
    creator: s.members.creator.pubkey, player: s.members.player.pubkey, moderator: s.members.moderator?.pubkey,
  } }
}
async function checked<T>(operation: Promise<T>, code: string) {
  try { return await operation } catch { return fail(code, code === "mintUnavailable" ? 503 : 400) }
}
function playerRole(role: Role): Player {
  if (role === "moderator") fail("forbidden", 403)
  return role
}
async function save(state: State, proofIds: string[] = []) {
  const revision = state.revision++
  const db = getDb()
  await db.begin(async tx => {
    const updated = await tx`UPDATE tracker_challenges SET state=${JSON.stringify(state)}::jsonb
      WHERE id=${state.id} AND (state->>'revision')::int=${revision} RETURNING id`
    if (!updated.length) fail("stateChanged")
    if (proofIds.length) {
      const inserted = await tx`INSERT INTO tracker_challenge_proofs ${tx(proofIds.map(id => ({ id, challenge_id: state.id })), "id", "challenge_id")}
        ON CONFLICT DO NOTHING RETURNING id`
      if (inserted.length !== proofIds.length) fail("badDeposit", 400)
    }
  })
}
function canSign(s: State, role: Role) {
  if (!s.result) return false
  if (s.votes[role] && s.votes[role] !== s.result && !s.disputed) return false
  return role !== "moderator" || s.disputed
}
function expired(s: State) { return s.expiresAt !== null && epoch() > s.expiresAt }
async function plan(s: State, depositor: Player, refund: boolean): Promise<ChallengeSettlement> {
  const outcome = refund ? "draw" : s.result
  const token = s.deposits[depositor]
  if (!outcome || !token) fail("stateChanged")
  return { plan: await checked(createPayoutPlan(terms(s), depositor, token, outcome), "mintUnavailable"), signatures: {}, receipt: null }
}

// Store each accepted leg immediately. A network failure or process restart
// retries the persisted plan; neither deposits nor blinding outputs change.
async function completeLeg(id: string, depositor: Player, refund: boolean) {
  const db = getDb()
  return db.begin(async tx => {
    const [row] = await tx<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE id=${id} FOR UPDATE`
    if (!row) fail("notFound", 404)
    const s = row.state
    const leg = (refund ? s.refunds : s.settlements)[depositor]
    const token = s.deposits[depositor]
    const result = refund ? "draw" : s.result
    if (!leg || !result || !token) fail("stateChanged")
    if (leg.receipt) return s
    if ((refund ? s.settlements : s.refunds)[depositor]?.receipt) fail("stateChanged")
    const signatures = Object.values(leg.signatures)
    const { creator, player, moderator } = leg.signatures
    const signed = refund ? expired(s) && leg.signatures[depositor]
      : s.disputed ? moderator && (creator || player) : creator && player
    if (!signed) fail("stateChanged")
    leg.receipt = await checked(settleDeposit(terms(s), depositor, token, result, leg.plan, signatures), "mintUnavailable")
    s.revision++
    await tx`UPDATE tracker_challenges SET state=${JSON.stringify(s)}::jsonb WHERE id=${id}`
    return s
  })
}
export async function act(s: State, role: Role, payload: unknown) {
  const command = actions.parse(payload)
  if (command.action === "invite") return rotateInvite(s.id, role, command.role)
  let proofIds: string[] = []
  switch (command.action) {
    case "fund": {
      const p = playerRole(role)
      if (s.deposits[p] === command.token) return { challenge: view(s, role) }
      if (!["funding", "expired"].includes(stageOf(s)) || s.deposits[p]) fail("stateChanged")
      await checked(verifyDeposit(terms(s), p, command.token), "badDeposit")
      proofIds = await checked(depositProofIds(command.token, s.mint), "badDeposit")
      s.deposits[p] = command.token
      break
    }
    case "vote": {
      const stage = stageOf(s)
      if (stage !== "active" && stage !== "disputed") fail("stateChanged")
      if (role === "moderator" && !s.disputed) fail("forbidden", 403)
      s.votes[role] = command.result
      if (s.disputed) {
        if (role === "moderator") s.result = command.result
      } else if (s.votes.creator && s.votes.player) {
        if (s.votes.creator === s.votes.player) s.result = s.votes.creator
        else if (s.arbitration !== "none") s.disputed = true
      }
      break
    }
    case "dispute":
      playerRole(role)
      if (stageOf(s) !== "active" || s.arbitration === "none") fail("stateChanged")
      s.disputed = true
      break
    case "prepare":
      if (!s.result || expired(s)) fail("stateChanged")
      if (s.settlements.creator && s.settlements.player) return { challenge: view(s, role) }
      for (const player of players) s.settlements[player] ??= await plan(s, player, false)
      break
    case "sign":
      if (!canSign(s, role) || expired(s)) fail("stateChanged")
      for (const p of players) {
        const leg = s.settlements[p]
        const sig = command.signatures[p]
        if (!leg || leg.receipt) fail("stateChanged")
        if (!await verifyPayoutSignature(leg.plan, s.members[role]!.pubkey, sig)) fail("badSignature", 400)
        leg.signatures[role] = sig
      }
      break
    case "settle":
      if (!s.result) fail("stateChanged")
      for (const player of players) s = await completeLeg(s.id, player, false)
      return { challenge: view(s, role) }
    case "prepareRefund": {
      const p = playerRole(role)
      if (!expired(s) || !s.deposits[p] || s.settlements[p]?.receipt) fail("stateChanged")
      if (s.refunds[p]) return { challenge: view(s, role) }
      s.refunds[p] = await plan(s, p, true)
      break
    }
    case "signRefund": {
      const p = playerRole(role)
      const leg = s.refunds[p]
      if (!leg || !expired(s) || leg.receipt || s.settlements[p]?.receipt) fail("stateChanged")
      if (!await verifyPayoutSignature(leg.plan, s.members[p]!.pubkey, command.signature)) fail("badSignature", 400)
      leg.signatures[p] = command.signature
      break
    }
    case "refund":
      return { challenge: view(await completeLeg(s.id, playerRole(role), true), role) }
  }
  await save(s, proofIds)
  return { challenge: view(s, role) }
}
