import { finalizeEvent, generateSecretKey } from "nostr-tools/pure"
import { decode } from "nostr-tools/nip19"
import { wrapEvent } from "nostr-tools/nip17"
import { SimplePool } from "nostr-tools/pool"

export type PrivateMessageFailure = "noInbox" | "dmUnavailable" | "dmRejected"
export class PrivateMessageError extends Error {
  constructor(public readonly code: PrivateMessageFailure) { super(code) }
}

function inboxRelays(tags: string[][]) {
  const relays = new Set<string>()
  for (const [tag, value] of tags) {
    if (tag !== "relay") continue
    try {
      const url = new URL(value)
      if (url.protocol === "wss:" && url.hostname && !url.username && !url.password && !url.hash) relays.add(url.href)
    } catch { /* One malformed relay must not prevent delivery to the others. */ }
  }
  return [...relays].slice(0, 6)
}

export async function sendChallengeInvite(npub: string, message: string) {
  const recipient = decode(npub)
  if (recipient.type !== "npub") throw new Error("invalidNpub")
  return sendPrivateChallengeMessage(recipient.data, message)
}

export async function sendPrivateChallengeMessage(recipient: string, message: string) {
  const pool = new SimplePool()
  try {
    const inbox = await pool.get(
      ["wss://purplepag.es", "wss://relay.damus.io", "wss://nos.lol"],
      { kinds: [10050], authors: [recipient] },
      { maxWait: 4500 },
    )
    const relays = inboxRelays(inbox?.tags ?? [])
    if (!relays.length) throw new PrivateMessageError("noInbox")
    // A one-use invitation sender works for creators using any tracker sign-in method.
    const sender = generateSecretKey()
    const event = wrapEvent(sender, { publicKey: recipient }, message)
    try {
      await Promise.any(
        pool.publish(relays, event, {
          maxWait: 10000,
          onauth: async (template) => finalizeEvent(template, sender),
        }),
      )
    } catch (failure) {
      const errors = failure instanceof AggregateError ? failure.errors : [failure]
      const rejected = errors.some(error => /^(auth-required|restricted|blocked|rate-limited|invalid|pow):/i.test(error instanceof Error ? error.message : String(error)))
      // Never expose the encrypted event, invitation token, or recovery contents in diagnostics.
      throw new PrivateMessageError(rejected ? "dmRejected" : "dmUnavailable")
    }
  } finally {
    pool.destroy()
  }
}
