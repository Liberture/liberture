import { createHash } from "node:crypto"
import { expect, it, vi } from "vitest"
import { createBlindSignature, createDLEQProof, createRandomSecretKey, deriveKeysetId, getDecodedToken, getPubKeyFromPrivKey, pointFromHex, sumProofs, schnorrVerifyDigest } from "@cashu/cashu-ts"
import { readAutomaticFunding, verifyInvitePayment, readFundingPayment, readAdvancePayment, advancePayment, challengePublicKey, fundDeposit, type CashuTerms } from "../cashu"
import { LIVE_MINT } from "../mints"

it("retries a legacy mint signature without a second invoice for reclaim or funding", async () => {
  const data = new Map<string, string>()
  vi.stubGlobal("localStorage", { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string,v: string) => data.set(k,v) })
  vi.stubGlobal("navigator", { locks: { request: (_: string, run: () => unknown) => run() } })
  const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex")
  const privateKeys = Array.from({length: 8}, () => createRandomSecretKey())
  const keys = Object.fromEntries(privateKeys.map((k,i) => [2 ** i,hex(getPubKeyFromPrivKey(k))]))
  const id = deriveKeysetId(keys, {versionByte:0})
  const keyset = { id, active:true, unit:"sat", input_fee_ppk:0 }
  const quotes = new Map<string, {quote:string; pubkey:string; state:string; request:string; amount:number; unit:string}>()
  let issued = 0
  let rejectedSignatures = 0
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    let result: unknown
    if (path === "/v1/info") result = {nuts:{4:{methods:[{method:"bolt11", unit:"sat"}]},9:{supported:true},11:{supported:true},12:{supported:true},20:{supported:true}}}
    else if (path === "/v1/keysets") result = {keysets:[keyset]}
    else if (path.startsWith("/v1/keys")) result = {keysets:[{...keyset,keys}]}
    else if (path === "/v1/mint/quote/bolt11") {
      const quote = {quote:crypto.randomUUID(),pubkey:body.pubkey,state:"UNPAID",request:"lnbcrt1u1qqqqqq",amount:body.amount,unit:"sat"}
      quotes.set(quote.quote,quote)
      result = quote
    } else if (path.startsWith("/v1/mint/quote/bolt11/")) result = quotes.get(path.split("/").pop()!)
    else if (path === "/v1/mint/bolt11") {
      const quote = quotes.get(body.quote)!
      expect(quote.state).toBe("PAID")
      if (quote.pubkey) {
        const valid = schnorrVerifyDigest(body.signature, createHash("sha256").update(quote.quote + body.outputs.map((o: {B_:string}) => o.B_).join("")).digest(), quote.pubkey)
        if (!valid) {
          rejectedSignatures++
          return new Response(JSON.stringify({code:20008, detail:"Invalid signature"}), {status:400})
        }
      }
      result = { signatures:body.outputs.map((o: {B_:string; amount:number}) => {
        const key = privateKeys[Math.log2(o.amount)]
        const point = pointFromHex(o.B_)
        const dleq = createDLEQProof(point,key)
        return {id,amount:o.amount,C_:createBlindSignature(point,key,id).C_.toHex(true),dleq:{e:hex(dleq.e),s:hex(dleq.s)}}
      }) }
      quote.state = "ISSUED"
      issued++
    } else if (path === "/v1/restore") result = {outputs:[],signatures:[]}
    else throw Error("Unexpected mint request " + path)
    return new Response(JSON.stringify(result), {headers:{"Content-Type":"application/json"}})
  })
  try {
    for (const reclaim of [true,false]) {
      const terms: CashuTerms = { id:crypto.randomUUID(), mint:LIVE_MINT, stake:100, refundAt:Math.floor(Date.now()/1000)+600, keys:{creator:challengePublicKey("creator"),player:challengePublicKey("player")} }
      const advance = (withdraw = false) => advancePayment("creator",terms,terms.keys.creator,withdraw)
      const status = () => readAdvancePayment("creator",terms,terms.keys.creator)
      expect(await status()).toBeNull()
      expect((await advance()).invoice).toBe("lnbcrt1u1qqqqqq")
      const quote = [...quotes.values()].at(-1)!
      expect(await status()).toEqual({invoice:quote.request})
      const verified = (amount = terms.stake) => verifyInvitePayment(terms.mint,quote.quote,terms.keys.creator,amount)
      expect(await verified()).toBe(false)
      quote.state = "PAID"
      expect(await verified()).toBe(true)
      expect(await verified(99)).toBe(false)
      expect(await status()).toEqual({paid:true,quote:quote.quote})
      expect(await advance()).toEqual({paid:true,quote:quote.quote})
      expect(await readAutomaticFunding("creator",terms,"creator",false)).toBeNull()
      expect(await readAutomaticFunding("creator",terms,"creator",true)).toEqual({paid:true})
      const token = reclaim ? (await advance(true)).token! : await fundDeposit("creator",terms,"creator",undefined,{existingOnly:true})
      const proofs = getDecodedToken(token,[id]).proofs
      expect(sumProofs(proofs).toNumber()).toBe(100)
      expect(proofs.every(p => p.secret.includes("P2PK"))).toBe(!reclaim)
      expect(await verified()).toBe(false)
      if (reclaim) {
        expect((await advance(true)).token).toBe(token)
        expect(await readAutomaticFunding("creator",terms,"creator",true)).toBeNull()
        await expect(fundDeposit("creator",terms,"creator",undefined,{existingOnly:true})).rejects.toThrow("No existing payment to lock")
      }
      else {
        await expect(advance(true)).rejects.toThrow("already assigned")
        expect(await fundDeposit("creator",terms,"creator")).toBe(token)
      }
    }
    const recipientTerms: CashuTerms = { id:crypto.randomUUID(), mint:LIVE_MINT, stake:100, refundAt:Math.floor(Date.now()/1000)+600, keys:{creator:challengePublicKey("creator"),player:challengePublicKey("recipient")} }
    expect(await readFundingPayment("recipient",recipientTerms,"player")).toBeNull()
    expect(quotes.size).toBe(2)
    await expect(fundDeposit("recipient",recipientTerms,"player",undefined,{existingOnly:true})).rejects.toThrow("No existing payment to lock")
    expect(quotes.size).toBe(2)
    const recipientToken = await fundDeposit("recipient",recipientTerms,"player",async invoice => {
      expect(invoice).toBe("lnbcrt1u1qqqqqq")
      expect(await readFundingPayment("recipient",recipientTerms,"player")).toMatchObject({paid:false,invoice})
      expect(quotes.size).toBe(3)
      ;[...quotes.values()].at(-1)!.state = "PAID"
    })
    expect(sumProofs(getDecodedToken(recipientToken,[id]).proofs).toNumber()).toBe(100)
    expect(await readFundingPayment("recipient",recipientTerms,"player")).toEqual({paid:true,token:recipientToken})
    expect(await fundDeposit("recipient",recipientTerms,"player")).toBe(recipientToken)
    expect(quotes.size).toBe(3)
    expect(issued).toBe(3)
    expect(rejectedSignatures).toBe(2)
  } finally { vi.unstubAllGlobals() }
})
