import { beforeEach, expect, it, vi } from "vitest"
import { generateSecretKey, getPublicKey } from "nostr-tools/pure"
import { npubEncode } from "nostr-tools/nip19"
import { unwrapEvent } from "nostr-tools/nip17"
import { sendChallengeInvite } from "../nostr-invite"

const pool = vi.hoisted(() => ({ get: vi.fn(), publish: vi.fn(), destroy: vi.fn() }))
vi.mock("nostr-tools/pool", () => ({ SimplePool: class { get = pool.get; publish = pool.publish; destroy = pool.destroy } }))
const receiver = generateSecretKey()
const npub = npubEncode(getPublicKey(receiver))
beforeEach(() => vi.resetAllMocks())
it("encrypts the invitation to the recipient and sends it to their inbox relay", async () => {
  pool.get.mockResolvedValue({ tags: [["relay", "wss://inbox.example"]] })
  pool.publish.mockReturnValue([Promise.resolve("ok")])
  await sendChallengeInvite(npub, "private challenge link")
  const [relays, event] = pool.publish.mock.calls[0]
  expect(relays).toEqual(["wss://inbox.example"])
  expect(event.kind).toBe(1059)
  expect(JSON.stringify(event)).not.toContain("private challenge link")
  expect(unwrapEvent(event, receiver).content).toBe("private challenge link")
  expect(pool.destroy).toHaveBeenCalledOnce()
})
it("offers no successful delivery when the recipient has no inbox", async () => {
  pool.get.mockResolvedValue(null)
  await expect(sendChallengeInvite(npub, "invitation")).rejects.toThrow("noInbox")
  expect(pool.publish).not.toHaveBeenCalled()
  expect(pool.destroy).toHaveBeenCalledOnce()
})
