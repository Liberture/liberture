import { afterEach, expect, it, vi } from "vitest"
import { performChallengeAuth } from "../nostr/challenge-auth"
const copy = { errorRateLimited: "rate", errorChallengeRequest: "challenge", errorNoChallenge: "missing", errorAuthFailed: "auth" }
afterEach(() => vi.unstubAllGlobals())
it("announces the signature request and never submits a signature after cancellation", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ challenge: "test" })))
  vi.stubGlobal("fetch", fetchMock)
  vi.stubGlobal("window", { location: { origin: "https://liberture.com" } })
  let sign: (value: any) => void = () => {}
  const signer = { signEvent: vi.fn(() => new Promise<any>(resolve => { sign = resolve })) }
  const waiting = vi.fn()
  const controller = new AbortController()
  const result = performChallengeAuth(signer, "ab".repeat(32), copy, controller.signal, waiting)
  await vi.waitFor(() => expect(waiting).toHaveBeenCalledOnce())
  controller.abort()
  sign({ id: "late" })
  await expect(result).rejects.toMatchObject({ name: "AbortError" })
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
