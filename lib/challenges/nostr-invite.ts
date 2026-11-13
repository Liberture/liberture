import { finalizeEvent, generateSecretKey } from "nostr-tools/pure"
import { decode } from "nostr-tools/nip19"
import { wrapEvent } from "nostr-tools/nip17"
import { SimplePool } from "nostr-tools/pool"

export async function sendChallengeInvite(npub: string, message: string) {
  const recipient = decode(npub)
  if (recipient.type !== "npub") throw new Error("invalidNpub")
  const pool = new SimplePool()
  try {
    const inbox = await pool.get(
      ["wss://purplepag.es", "wss://relay.damus.io", "wss://nos.lol"],
      { kinds: [10050], authors: [recipient.data] },
      { maxWait: 4500 },
    )
    const relays =
      inbox?.tags
        .filter(([tag, url]) => tag === "relay" && /^wss:\/\//.test(url))
        .map((tag) => tag[1])
        .slice(0, 6) ?? []
    if (!relays.length) throw new Error("noInbox")
    // A one-use invitation sender works for creators using any tracker sign-in method.
    const sender = generateSecretKey()
    const event = wrapEvent(sender, { publicKey: recipient.data }, message)
    await Promise.any(
      pool.publish(relays, event, {
        maxWait: 6000,
        onauth: async (template) => finalizeEvent(template, sender),
      }),
    )
  } finally {
    pool.destroy()
  }
}
