import { expect, it } from "vitest"
import { automaticSettlementStep } from "../automatic-settlement"
import type { Challenge, ChallengeSettlement, Result } from "../types"

function match(result: Result): Challenge {
  return { id:"match",stage:"settling",role:"creator",result,votes:{creator:result,player:result},settlements:{},disputed:false } as Challenge
}
const leg = (): ChallengeSettlement => ({plan:{} as ChallengeSettlement["plan"],signatures:{},receipt:null})
it.each(["draw","creator","player"] as const)("automates the two-device agreement for %s", result => {
  const c = match(result)
  expect(automaticSettlementStep(c)).toBe("prepare")
  c.settlements = {creator:leg(),player:leg()}
  expect(automaticSettlementStep(c)).toBe("sign")
  for (const p of ["creator","player"] as const) c.settlements[p]!.signatures.creator="signed"
  expect(automaticSettlementStep(c)).toBeNull()
  c.role="player"
  expect(automaticSettlementStep(c)).toBe("sign")
  for (const p of ["creator","player"] as const) c.settlements[p]!.signatures.player="signed"
  expect(automaticSettlementStep(c)).toBe("settle")
  c.settlements.creator!.receipt="already paid"
  expect(automaticSettlementStep(c)).toBe("settle")
  c.stage="settled"
  expect(automaticSettlementStep(c)).toBeNull()
})
it("never signs without matching votes for the exact result", () => {
  const c=match("draw")
  delete c.votes.player
  expect(automaticSettlementStep(c)).toBeNull()
  c.votes.player="creator"
  expect(automaticSettlementStep(c)).toBeNull()
  c.votes.player="draw";c.disputed=true
  expect(automaticSettlementStep(c)).toBeNull()
  c.disputed=false;c.stage="expired"
  expect(automaticSettlementStep(c)).toBeNull()
})
it("never signs on behalf of another member", () => {
 const c=match("draw");c.role="moderator";c.settlements={creator:leg(),player:leg()}
 expect(automaticSettlementStep(c)).toBeNull()
})
