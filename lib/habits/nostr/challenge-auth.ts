import type { Event, EventTemplate } from "nostr-tools"
import { buildAuthEvent } from "./auth-event"
export interface ChallengeSigner { signEvent(template: EventTemplate): Promise<Event> }
export type ChallengeAuthStrings = { errorRateLimited: string; errorChallengeRequest: string; errorNoChallenge: string; errorAuthFailed: string }

export async function performChallengeAuth(
  signer: ChallengeSigner,
  pubkey: string,
  t: ChallengeAuthStrings,
  signal?: AbortSignal,
  onWaiting?: () => void
): Promise<void> {
  const challengeRes = await fetch(
    `/api/auth/nostr/challenge?pubkey=${encodeURIComponent(pubkey)}`, { signal }
  )
  if (challengeRes.status === 429) throw new Error(t.errorRateLimited)
  if (!challengeRes.ok) {
    const err = await challengeRes
      .json()
      .catch(() => ({ error: t.errorChallengeRequest }))
    throw new Error(err.error || t.errorChallengeRequest)
  }
  const { challenge } = await challengeRes.json()
  if (!challenge) throw new Error(t.errorNoChallenge)

  signal?.throwIfAborted()
  onWaiting?.()
  const signedEvent = await signer.signEvent(buildAuthEvent(challenge, "/api/auth/nostr"))

  signal?.throwIfAborted()
  const authRes = await fetch("/api/auth/nostr", {
    signal,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkey, signedEvent }),
  })
  if (authRes.status === 429) throw new Error(t.errorRateLimited)
  if (!authRes.ok) {
    const err = await authRes
      .json()
      .catch(() => ({ error: t.errorAuthFailed }))
    throw new Error(err.error || t.errorAuthFailed)
  }
}
