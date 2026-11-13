import { expect, it, vi, afterEach } from "vitest"
import { generateSecretKey, getPublicKey } from "nostr-tools/pure"
import { unwrapEvent } from "nostr-tools/nip17"
import { SimplePool } from "nostr-tools/pool"
import { backUpChallengeKey } from "../key-backup"
import { challengePublicKey, exportChallengeKey } from "../cashu"

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
it("sends only the owner an encrypted key and marks delivery only after acknowledgment", async () => {
  const data = new Map<string,string>()
  vi.stubGlobal("localStorage",{getItem:(k:string)=>data.get(k),setItem:(k:string,v:string)=>data.set(k,v)})
  vi.stubGlobal("navigator",{locks:{request:(_k: string,_opts:unknown,f:()=>unknown)=>f()}})
  const privateKey = generateSecretKey()
  const account = getPublicKey(privateKey)
  const key = challengePublicKey("owner")
  data.set("challenge-wallet-for:" + key,"owner")
  const target = { key, recipient: "wrong" }
  vi.stubGlobal("fetch",async()=>new Response(JSON.stringify(target)))
  vi.spyOn(SimplePool.prototype,"get").mockResolvedValue({ tags:[["relay","wss://relay.invalid"]] } as never)
  const publish = vi.spyOn(SimplePool.prototype,"publish").mockReturnValue([Promise.resolve("ok")])
  const backup = () => backUpChallengeKey("challenge",key,account,new AbortController().signal)
  expect(await backup()).toBe(false)
  expect(publish).not.toHaveBeenCalled()
  target.recipient = account
  publish.mockImplementationOnce(()=>[Promise.reject(new Error("offline"))])
  await expect(backup()).rejects.toThrow()
  expect(await backup()).toBe(true)
  expect(await backup()).toBe(true)
  expect(publish).toHaveBeenCalledTimes(2)
  const event = publish.mock.calls[1][1]
  expect(JSON.stringify(event)).not.toContain(exportChallengeKey("owner"))
  expect(JSON.parse(unwrapEvent(event,privateKey).content).signingKey).toBe(exportChallengeKey("owner"))
  expect(()=>unwrapEvent(event,generateSecretKey())).toThrow()
})
