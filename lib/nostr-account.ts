import { prisma } from "@/lib/prisma"
import { decrypt, isEncrypted } from "@/lib/crypto"

export interface LibertureNostrAccount {
  npub: string
  pubkeyHex: string
  nbunkerUrl: string | null
  nbunkerSecret: string | null
}

/**
 * Get the Liberture Nostr account with decrypted credentials.
 * Use this when you need to connect to the bunker for signing.
 */
export async function getLibertureNostrAccount(): Promise<LibertureNostrAccount | null> {
  const account = await prisma.nostrAccount.findFirst({
    where: { role: "liberture" },
    select: {
      npub: true,
      pubkeyHex: true,
      nbunkerUrl: true,
      nbunkerSecret: true,
    },
  })

  if (!account) return null

  // Decrypt the secret if it's encrypted
  let decryptedSecret: string | null = null
  if (account.nbunkerSecret) {
    try {
      if (isEncrypted(account.nbunkerSecret)) {
        decryptedSecret = decrypt(account.nbunkerSecret)
      } else {
        // Legacy unencrypted secret
        decryptedSecret = account.nbunkerSecret
      }
    } catch (e) {
      console.error("Failed to decrypt nbunkerSecret:", e)
      decryptedSecret = null
    }
  }

  return {
    npub: account.npub,
    pubkeyHex: account.pubkeyHex,
    nbunkerUrl: account.nbunkerUrl,
    nbunkerSecret: decryptedSecret,
  }
}
