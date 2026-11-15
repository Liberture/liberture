import { expect, it } from "vitest"
import { challengeNextAction } from "../next-action"
import type { Challenge } from "../types"
const match = (overrides: Partial<Challenge> = {}): Challenge => ({
  id: "test", title: "Walk", rules: "Walk daily", createdAt: "", durationDays: 14, stake: 100, mint: "", role: "player", stage: "funding", expiresAt: 123,
  members: { creator: { name: "Leon", pubkey: "a" }, player: { name: "Ana", pubkey: "b" } }, deposits: {}, votes: {}, refunds: {}, settlements: {}, disputed: false, result: null, revision: 1, ...overrides,
})
it("tells the invite recipient exactly who is waiting for their stake", () => {
  expect(challengeNextAction(match({ deposits: { creator: "paid" } }))).toEqual({ name: "Leon", kind: "pay" })
})
it("distinguishes confirming an advance from charging the creator again", () => {
  expect(challengeNextAction(match({ role: "creator" }), true)).toEqual({ name: "Ana", kind: "confirmStake" })
})
it("never asks a funded player or moderator to pay", () => {
  expect(challengeNextAction(match({ deposits: { player: "paid" } })).kind).toBe("waitPayment")
  expect(challengeNextAction(match({ role: "moderator" })).kind).toBe("waitPayment")
})
it("moves to daily tasks when both locked stakes start the race", () => {
  expect(challengeNextAction(match({ stage: "active", deposits: { player: "paid", creator: "paid" } })).kind).toBe("dailyTask")
})
