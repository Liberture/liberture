import { existingChallengeKey } from "./cashu"
import { sendPrivateChallengeMessage } from "./nostr-invite"

export async function backUpChallengeKey(id: string, key: string, account: string, signal: AbortSignal) {
  const owner = localStorage.getItem("challenge-wallet-for:" + key)
  if (!owner) return false
  const marker = "challenge:backup:" + account + ":" + key
  return navigator.locks.request(marker, { signal }, async () => {
    if (signal.aborted) return false
    if (localStorage.getItem(marker)) return true
    const secret = existingChallengeKey(owner, key)
    if (!secret) return false
    const response = await fetch("/api/challenges/" + id + "/backup-recipient", {
      signal, credentials: "same-origin", cache: "no-store",
    })
    if (!response.ok) return false
    const target = await response.json()
    if (signal.aborted || target.key !== key || target.recipient !== account) return false
    await sendPrivateChallengeMessage(account, JSON.stringify({
      type: "liberture-challenge-recovery", version: 1, challenge: id, publicKey: key, signingKey: secret,
    }))
    // Only mark delivery after a relay acknowledges the encrypted event.
    localStorage.setItem(marker, "1")
    return true
  })
}
