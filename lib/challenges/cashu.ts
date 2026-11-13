import {
  Amount, createRandomSecretKey, deserializeSwapPreview, getEncodedToken, getPubKeyFromPrivKey,
  OutputData, pointFromHex, schnorrVerifyDigest, serializeSwapPreview, SigAll, sumProofs, Wallet,
  type OutputDataLike, type Proof, type SerializedOutputData, type SerializedSwapPreview,
} from "@cashu/cashu-ts"

import { LIVE_MINT, TEST_MINT } from "./mints"
export type CashuRole = "creator" | "player" | "moderator"
export type CashuPlayer = Exclude<CashuRole, "moderator">
export type CashuOutcome = CashuPlayer | "draw"
export type CashuPlan = SerializedSwapPreview
export interface CashuTerms {
  mint: string
  id: string
  stake: number
  refundAt: number
  keys: Record<CashuPlayer, string> & {moderator?: string}
}

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const roles: CashuRole[] = ["creator", "player", "moderator"]
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("")
const keyStorage = (owner: string) => "liberture:challenge:key:" + owner

function publicKey(key: string) {
  ensure(/^[a-f0-9]{64}$/i.test(key), "Invalid challenge recovery key")
  return hex(getPubKeyFromPrivKey(Uint8Array.from(key.match(/../g)!, byte => parseInt(byte, 16))))
}

export function exportChallengeKey(owner: string): string {
  const name = keyStorage(owner)
  const existing = localStorage.getItem(name)
  if (existing) return existing
  const key = hex(createRandomSecretKey())
  localStorage.setItem(name, key)
  return key
}

export function challengePublicKey(owner: string) {
  return publicKey(exportChallengeKey(owner))
}

export function importChallengeKey(owner: string, key: string) {
  publicKey(key)
  localStorage.setItem(keyStorage(owner), key.toLowerCase())
}

const wallets = new Map<string, { since: number; ready: Promise<Wallet> }>()
function getWallet(mint: string) {
  ensure(mint === LIVE_MINT || mint === TEST_MINT, "Unsupported challenge mint")
  const cached = wallets.get(mint)
  if (cached && Date.now() - cached.since < 300000) return cached.ready
  const wallet = new Wallet(mint)
  const ready = wallet.loadMint().then(() => {
    for (const nut of [9, 11, 12] as const) ensure(wallet.getMintInfo().isSupported(nut).supported, "Mint does not support the required spending conditions")
    return wallet
  })
  wallets.set(mint, { since: Date.now(), ready })
  void ready.catch(() => { if (wallets.get(mint)?.ready === ready) wallets.delete(mint) })
  return ready
}

function signingKeys(terms: CashuTerms) {
  return [terms.keys.creator, terms.keys.player, ...(terms.keys.moderator ? [terms.keys.moderator] : [])]
}

function checkTerms(terms: CashuTerms) {
  const keys = signingKeys(terms)
  ensure(terms.id && Number.isSafeInteger(terms.stake) && terms.stake > 0 &&
    Number.isSafeInteger(terms.refundAt) && terms.refundAt > 0, "Invalid challenge terms")
  ensure(keys.every(key => /^(02|03)[0-9a-f]{64}$/.test(key) && pointFromHex(key)) &&
    new Set(keys.map(key => key.slice(2))).size === keys.length, "Challenge requires distinct signing keys")
}

function escrowTags(terms: CashuTerms, depositor: CashuPlayer) {
  return [
    ["locktime", String(terms.refundAt)], ["pubkeys", ...signingKeys(terms).slice(1)],
    ["n_sigs", "2"], ["refund", terms.keys[depositor]], ["sigflag", "SIG_ALL"], ["challenge", terms.id],
  ]
}

function checkLock(secret: string, key: string, tags: string[][]) {
  const lock = JSON.parse(secret)
  ensure(Array.isArray(lock) && lock.length === 2 && lock[0] === "P2PK" &&
    /^[0-9a-f]{64}$/.test(lock[1]?.nonce) && lock[1].data === key &&
    JSON.stringify(lock[1].tags ?? []) === JSON.stringify(tags), "Unexpected Cashu spending conditions")
}

function encode(proofs: Proof[], mint: string) {
  return getEncodedToken({ mint, unit: "sat", proofs })
}

async function decode(wallet: Wallet, token: string) {
  const result = wallet.decodeToken(token)
  ensure(result.mint === wallet.mint.mintUrl && result.unit === "sat" && result.proofs.length > 0 && result.proofs.length <= 128,
    "Unexpected mint or unit")
  const proofs = result.proofs
  ensure(new Set(proofs.map(p => p.secret)).size === proofs.length &&
    new Set(proofs.map(p => p.C)).size === proofs.length, "Duplicate Cashu proof")
  await wallet.ensureOperableKeysets(proofs.map(p => p.id))
  ensure(proofs.every(p => !p.witness && !p.p2pk_e && wallet.getKeyset(p.id).unit === "sat" &&
    wallet.getKeyset(p.id).keys[p.amount.toNumber()]), "Invalid Cashu proof")
  ensure((await wallet.verifyMintSignatures(proofs, { require: true })).invalid.length === 0, "Unverified mint signature")
  return proofs
}

export async function depositProofIds(token: string, mint: string) {
  return (await getWallet(mint)).decodeToken(token).proofs.map(proof => proof.C)
}

async function depositInputs(wallet: Wallet, terms: CashuTerms, depositor: CashuPlayer, token: string) {
  checkTerms(terms)
  const proofs = await decode(wallet, token)
  ensure(sumProofs(proofs).equals(terms.stake), "Incorrect challenge stake")
  for (const p of proofs) checkLock(p.secret, terms.keys.creator, escrowTags(terms, depositor))
  return proofs
}

export async function verifyDeposit(terms: CashuTerms, depositor: CashuPlayer, token: string) {
  const wallet = await getWallet(terms.mint)
  const proofs = await depositInputs(wallet, terms, depositor, token)
  ensure((await wallet.groupProofsByState(proofs)).unspent.length === proofs.length, "Deposit has already been used")
}

async function completeOrRestore(wallet: Wallet, outputs: OutputDataLike[], perform: () => Promise<Proof[]>) {
  try {
    return await perform()
  } catch (originalError) {
    // A lost response may have arrived after the mint consumed the inputs.
    const restored = await wallet.mint.restore({ outputs: outputs.map(o => o.blindedMessage) })
    ensure(restored.outputs.length === restored.signatures.length, "Incomplete Cashu restore response")
    const indices = new Map(restored.outputs.map((o, i) => [o.B_, i]))
    if (outputs.some(o => !indices.has(o.blindedMessage.B_))) throw originalError
    return outputs.map(o => {
      const sig = restored.signatures[indices.get(o.blindedMessage.B_)!]
      ensure(sig.id === o.blindedMessage.id && sig.amount.equals(o.blindedMessage.amount), "Invalid restored signature")
      return o.toProof(sig, wallet.getKeyset(sig.id))
    })
  }
}

function withWalletLock<T>(name: string, run: () => Promise<T>) {
  ensure(typeof navigator !== "undefined" && navigator.locks, "Challenge wallet needs a secure browser context")
  return navigator.locks.request(name, run)
}

interface FundingRecord { invoice?: string; quote: string; outputs: SerializedOutputData[]; token?: string }
export async function fundDeposit(owner: string, terms: CashuTerms, depositor: CashuPlayer, onInvoice?: (invoice: string) => void) {
  checkTerms(terms)
  ensure(challengePublicKey(owner) === terms.keys[depositor], "Wrong challenge signing key")
  const name = "liberture:challenge:deposit:" + JSON.stringify([owner, terms.id, depositor])
  return withWalletLock(name, async () => {
    const wallet = await getWallet(terms.mint)
    const existing = localStorage.getItem(name)
    let record: FundingRecord
    if (existing) record = JSON.parse(existing)
    else {
      ensure(Date.now() < terms.refundAt * 1000, "Challenge has expired")
      const outputs = OutputData.createP2PKData({
        pubkey: signingKeys(terms), requiredSignatures: 2,
        locktime: terms.refundAt, refundKeys: [terms.keys[depositor]], sigFlag: "SIG_ALL",
        additionalTags: [["challenge", terms.id]],
      }, terms.stake, wallet.getKeyset())
      const { quote, request } = await wallet.createMintQuoteBolt11(terms.stake)
      record = { quote, invoice: request, outputs: outputs.map(OutputData.serialize) }
      localStorage.setItem(name, JSON.stringify(record))
    }
    if (record.token) return record.token
    const outputs = record.outputs.map(OutputData.deserialize)
    let quote = await wallet.checkMintQuoteBolt11(record.quote)
    if (quote.state === "UNPAID") onInvoice?.(quote.request)
    for (let i = 0; i < 12 && quote.state === "UNPAID"; i++) {
      await new Promise(resolve => setTimeout(resolve, 1250))
      quote = await wallet.checkMintQuoteBolt11(record.quote)
    }
    if (quote.state === "UNPAID" && quote.expiry && quote.expiry <= Date.now()/1000) {
      localStorage.removeItem(name)
      throw new Error("Invoice expired. Request a new invoice.")
    }
    ensure(quote.state !== "UNPAID", "Invoice awaiting payment.")
    const proofs = await completeOrRestore(wallet, outputs, () =>
      wallet.mintProofsBolt11(terms.stake, quote, {}, { type: "custom", data: outputs }))
    const token = encode(proofs, terms.mint)
    await depositInputs(wallet, terms, depositor, token)
    localStorage.setItem(name, JSON.stringify({ ...record, token }))
    return token
  })
}

const beneficiary = (depositor: CashuPlayer, outcome: CashuOutcome) => outcome === "draw" ? depositor : outcome

export async function createPayoutPlan(terms: CashuTerms, depositor: CashuPlayer, token: string, outcome: CashuOutcome) {
  const wallet = await getWallet(terms.mint)
  const inputs = await depositInputs(wallet, terms, depositor, token)
  const preview = await wallet.prepareSwapToReceive(inputs, { requireDleq: true }, {
    type: "p2pk", options: { pubkey: terms.keys[beneficiary(depositor, outcome)] },
  })
  return serializeSwapPreview(preview)
}

async function checkedPlan(wallet: Wallet, terms: CashuTerms, depositor: CashuPlayer, token: string,
  outcome: CashuOutcome, plan: CashuPlan) {
  const inputs = await depositInputs(wallet, terms, depositor, token)
  const preview = deserializeSwapPreview(plan)
  ensure(inputs.length === preview.inputs.length && inputs.every((p, i) => {
    const other = preview.inputs[i]
    return p.C === other.C && p.secret === other.secret && p.id === other.id && p.amount.equals(other.amount) && !other.witness
  }), "Payout inputs differ from the locked deposit")
  const outputs = preview.keepOutputs ?? []
  ensure(!preview.sendOutputs?.length && outputs.length > 0 && outputs.length <= 128 &&
    new Set(outputs.map(o => o.blindedMessage.B_)).size === outputs.length &&
    new Set(outputs.map(o => hex(o.secret))).size === outputs.length, "Invalid payout outputs")
  const keyset = wallet.getKeyset(preview.keysetId)
  const target = terms.keys[beneficiary(depositor, outcome)]
  for (const o of outputs) {
    ensure(o.blindedMessage.id === keyset.id && keyset.unit === "sat" && keyset.keys[o.blindedMessage.amount.toNumber()] &&
      !o.ephemeralE, "Invalid payout denomination")
    checkLock(new TextDecoder().decode(o.secret), target, [])
  }
  const fees = wallet.getFeesForProofs(inputs)
  ensure(preview.fees.equals(fees) && preview.amount.equals(Amount.from(terms.stake).subtract(fees)) &&
    OutputData.sumOutputAmounts(outputs).equals(preview.amount), "Incorrect payout amount or fee")
  return preview
}

export async function signPayout(owner: string, terms: CashuTerms, depositor: CashuPlayer, token: string,
  outcome: CashuOutcome, plan: CashuPlan) {
  const wallet = await getWallet(terms.mint)
  const preview = await checkedPlan(wallet, terms, depositor, token, outcome, plan)
  const key = exportChallengeKey(owner)
  ensure(roles.some(role => terms.keys[role] === publicKey(key)), "Wrong challenge signing key")
  const pkg = SigAll.extractSwapPackage(preview)
  return SigAll.signPackage(pkg, key).witness!.signatures[0]
}

export function verifyPayoutSignature(plan: CashuPlan, pubkey: string, sig: string) {
  try {
    const pkg = SigAll.extractSwapPackage(deserializeSwapPreview(plan))
    return /^[a-f0-9]{128}$/i.test(sig) && schnorrVerifyDigest(sig, SigAll.computeDigests(pkg.inputs, pkg.outputs).v0, pubkey)
  } catch {
    return false
  }
}

export async function settleDeposit(terms: CashuTerms, depositor: CashuPlayer, token: string,
  outcome: CashuOutcome, plan: CashuPlan, signatures: string[]) {
  const wallet = await getWallet(terms.mint)
  const preview = await checkedPlan(wallet, terms, depositor, token, outcome, plan)
  const signers = roles.filter(role => terms.keys[role] && signatures.some(sig => verifyPayoutSignature(plan, terms.keys[role]!, sig)))
  const refundAllowed = outcome === "draw" && signers.includes(depositor) && Date.now() >= terms.refundAt * 1000
  ensure(signers.length >= 2 || refundAllowed, "Missing challenge signatures")
  const pkg = SigAll.extractSwapPackage(preview)
  const signed = SigAll.mergeSwapPackage({ ...pkg, witness: { signatures } }, preview)
  const proofs = await completeOrRestore(wallet, preview.keepOutputs!, async () => (await wallet.completeSwap(signed)).keep)
  return encode(proofs, terms.mint)
}

export async function redeemPayout(owner: string, token: string, mint: string) {
  const key = exportChallengeKey(owner)
  const digest = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))))
  const name = "liberture:challenge:redeem:" + JSON.stringify([owner, digest])
  return withWalletLock(name, async () => {
    const wallet = await getWallet(mint)
    const existing = localStorage.getItem(name)
    let record: { plan: CashuPlan; bearer?: string }
    if (existing) record = JSON.parse(existing)
    else {
      const inputs = await decode(wallet, token)
      for (const input of inputs) checkLock(input.secret, publicKey(key), [])
      const preview = await wallet.prepareSwapToReceive(inputs, { requireDleq: true }, { type: "random" })
      record = { plan: serializeSwapPreview(preview) }
      localStorage.setItem(name, JSON.stringify(record))
    }
    if (record.bearer) return record.bearer
    const preview = deserializeSwapPreview(record.plan)
    const proofs = await completeOrRestore(wallet, preview.keepOutputs!, async () => (await wallet.completeSwap(preview, key)).keep)
    const bearer = encode(proofs, mint)
    localStorage.setItem(name, JSON.stringify({ ...record, bearer }))
    return bearer
  })
}
