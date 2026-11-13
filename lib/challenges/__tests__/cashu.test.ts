import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Amount, OutputData, serializeSwapPreview, SigAll, type Proof } from "@cashu/cashu-ts"
import {
  challengePublicKey, createPayoutPlan, exportChallengeKey, fundDeposit, importChallengeKey,
  redeemPayout, settleDeposit, signPayout, verifyDeposit, verifyPayoutSignature, type CashuTerms,
} from "../cashu"

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  })
  vi.stubGlobal("navigator", { locks: { request: (_name: string, run: () => unknown) => run() } })
})
afterEach(() => vi.unstubAllGlobals())

describe("challenge wallet", () => {
  it("recovers the same signing identity and isolates different owners", () => {
    const first = challengePublicKey("creator")
    expect(challengePublicKey("creator")).toBe(first)
    expect(challengePublicKey("player")).not.toBe(first)
    importChallengeKey("recovered", exportChallengeKey("creator"))
    expect(challengePublicKey("recovered")).toBe(first)
    expect(() => importChallengeKey("creator", "invalid")).toThrow()
    expect(challengePublicKey("creator")).toBe(first)
  })

  it("binds signatures to the exact mint inputs and blinded outputs", () => {
    const amount = Amount.from(8)
    const keysetId = "001234567890abcd"
    const pubkey = challengePublicKey("player")
    const proof: Proof = { amount, id: keysetId, secret: "input", C: pubkey }
    const preview = { amount, fees: Amount.zero(), keysetId, inputs: [proof],
      keepOutputs: [OutputData.createSingleP2PKData({ pubkey }, amount, keysetId)] }
    const plan = serializeSwapPreview(preview)
    const pkg = SigAll.extractSwapPackage(preview)
    const sig = SigAll.signDigest(SigAll.computeDigests(pkg.inputs, pkg.outputs).v0, exportChallengeKey("player"))
    expect(verifyPayoutSignature(plan, pubkey, sig)).toBe(true)
    expect(verifyPayoutSignature(plan, challengePublicKey("moderator"), sig)).toBe(false)
    expect(verifyPayoutSignature({ ...plan, inputs: [{ ...plan.inputs[0], secret: "different" }] }, pubkey, sig)).toBe(false)
    const redirected = { ...preview, keepOutputs: [OutputData.createSingleP2PKData({ pubkey: challengePublicKey("moderator") }, amount, keysetId)] }
    const other = serializeSwapPreview(redirected)
    expect(verifyPayoutSignature(other, pubkey, sig)).toBe(false)
    // Keep the originally signed blinded message but substitute its disclosed
    // recipient. Validation must independently re-blind before trusting it.
    const substituted = { ...plan, keepOutputs: [{
      ...other.keepOutputs![0], blindedMessage: plan.keepOutputs![0].blindedMessage,
    }] }
    expect(verifyPayoutSignature(substituted, pubkey, sig)).toBe(false)
  })

  // Public FakeWallet only. Offline test runs do not require mint availability.
  it.runIf(process.env.TEST_CASHU_MINT === "1")("funds two stakes, arbitrates a winner and restores spent outputs on retry", async () => {
    const terms: CashuTerms = { id: crypto.randomUUID(), stake: 24, refundAt: Math.floor(Date.now() / 1000) + 600,
      keys: { creator: challengePublicKey("creator"), player: challengePublicKey("player"), moderator: challengePublicKey("moderator") } }
    for (const depositor of ["creator", "player"] as const) {
      const token = await fundDeposit(depositor, terms, depositor)
      expect(await fundDeposit(depositor, terms, depositor)).toBe(token)
      await verifyDeposit(terms, depositor, token)
      await expect(verifyDeposit({ ...terms, id: crypto.randomUUID() }, depositor, token)).rejects.toThrow()
      const plan = await createPayoutPlan(terms, depositor, token, "player")
      await expect(signPayout("creator", terms, depositor, token, "creator", plan)).rejects.toThrow()
      const signatures = await Promise.all(["player", "moderator"].map(person => signPayout(person, terms, depositor, token, "player", plan)))
      await expect(settleDeposit(terms, depositor, token, "player", plan, [signatures[0], signatures[0]])).rejects.toThrow()
      const payout = await settleDeposit(terms, depositor, token, "player", plan, signatures)
      expect(await settleDeposit(terms, depositor, token, "player", plan, signatures)).toBe(payout)
      await expect(redeemPayout("creator", payout)).rejects.toThrow()
      const bearer = await redeemPayout("player", payout)
      expect(await redeemPayout("player", payout)).toBe(bearer)
    }
  }, 120000)
})
