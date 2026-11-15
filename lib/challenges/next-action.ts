import type { Challenge } from "./types"

export function challengeNextAction(c: Challenge, advancePaid = false) {
  const me = c.role
  const other = me === "creator" ? "player" : "creator"
  const name = c.members[other]?.name || (other === "player" ? c.invitedPlayerName : undefined) || ""
  const ownDeposit = me !== "moderator" && !!c.deposits[me]
  if (c.stage === "inviting") return { name, kind: me === "creator" && !advancePaid && !ownDeposit ? "payFirst" : "waitJoin" } as const
  if (c.stage === "funding") return { name, kind: me === "moderator" || ownDeposit ? "waitPayment" : me === "creator" && advancePaid ? "confirmStake" : "pay" } as const
  if (c.stage === "active") return { name, kind: me === "moderator" ? "watchRace" : c.votes[me] ? "waitResult" : "dailyTask" } as const
  if (c.stage === "disputed") return { name, kind: me === "moderator" ? "decide" : "waitModerator" } as const
  if (c.stage === "expired") return { name, kind: ownDeposit && !c.refunds[me as "creator" | "player"]?.receipt && !c.settlements[me as "creator" | "player"]?.receipt ? "refund" : "finished" } as const
  if (c.stage === "settled") return { name, kind: "collect" } as const
  return { name, kind: "payout" } as const
}
