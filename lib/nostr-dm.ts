import { finalizeEvent, generateSecretKey, getPublicKey } from "nostr-tools/pure"
import * as nip04 from "nostr-tools/nip04"
import { Relay } from "nostr-tools/relay"

// Liberture npub in hex format
export const LIBERTURE_PUBKEY_HEX = "d9590d95a7811e1cb312be66edd664d7e3e6ed57822ad9f213ed620fc6748be8"
export const LIBERTURE_NPUB = "npub1m9vsm9d8sy0pevcjhenwm4ny6l37dm2hsg4dnusna43ql3n5305qy4zlg4"

// Relays for DM publishing
const DM_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://purplepag.es",
]

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Send an ephemeral DM to Liberture's npub.
 * Uses NIP-04 encryption with a throwaway key (anonymous DM).
 * 
 * @param message - The message content
 * @param senderPubkey - The sender's pubkey (for context, included in message prefix)
 * @returns Object with success status and published event IDs
 */
export async function sendCollaborationDM(
  message: string,
  senderNpub: string
): Promise<{ success: boolean; eventIds: string[]; errors: string[] }> {
  const eventIds: string[] = []
  const errors: string[] = []

  // Generate ephemeral keys for anonymous DM
  const ephemeralSecretKey = generateSecretKey()
  const ephemeralPubkey = getPublicKey(ephemeralSecretKey)
  const ephemeralSecretKeyHex = bytesToHex(ephemeralSecretKey)

  // Compose the message with context
  const fullMessage = `[Liberture Collaboration Request]

From: ${senderNpub}

Message:
${message}

---
Sent via liberture.com`

  try {
    // Encrypt with NIP-04 (standard DM encryption)
    const encryptedContent = await nip04.encrypt(
      ephemeralSecretKeyHex,
      LIBERTURE_PUBKEY_HEX,
      fullMessage
    )

    // Create kind 4 DM event
    const event = finalizeEvent(
      {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", LIBERTURE_PUBKEY_HEX]],
        content: encryptedContent,
      },
      ephemeralSecretKey
    )

    // Publish to multiple relays
    const publishPromises = DM_RELAYS.map(async (url) => {
      try {
        const relay = await Relay.connect(url)
        await relay.publish(event)
        relay.close()
        return { url, success: true, id: event.id }
      } catch (e) {
        return { url, success: false, error: String(e) }
      }
    })

    const results = await Promise.allSettled(publishPromises)

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          eventIds.push(result.value.id)
        } else {
          errors.push(`${result.value.url}: ${result.value.error}`)
        }
      } else {
        errors.push(`Publish failed: ${result.reason}`)
      }
    }

    return {
      success: eventIds.length > 0,
      eventIds: [...new Set(eventIds)], // Dedupe (same event ID)
      errors,
    }
  } catch (e) {
    return {
      success: false,
      eventIds: [],
      errors: [`Encryption failed: ${String(e)}`],
    }
  }
}
