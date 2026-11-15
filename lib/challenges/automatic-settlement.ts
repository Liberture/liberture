import type { Challenge } from "./types"

/** A matching vote authorizes only that exact agreed result, never a disputed payout. */
export function automaticSettlementStep(c: Challenge): "prepare" | "sign" | "settle" | null {
  if (c.stage !== "settling" || c.disputed || !c.result ||
      c.votes.creator !== c.result || c.votes.player !== c.result) return null
  const legs = [c.settlements.creator, c.settlements.player]
  if (legs.some(leg => !leg)) return "prepare"
  if (legs.every(leg => leg!.signatures.creator && leg!.signatures.player)) return "settle"
  if (c.role !== "moderator" && legs.some(leg => !leg!.signatures[c.role])) return "sign"
  return null
}
