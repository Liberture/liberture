/**
 * Nostr cryptographic utilities
 * Key generation, conversion, and signing
 */

import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools'

// Inline utils to avoid @noble/hashes subpath resolution issues in Next.js
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

const hexToBytes = (hex: string): Uint8Array => {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return arr
}

export interface NostrKeyPair {
  privateKey: Uint8Array
  publicKey: string // hex
  nsec: string
  npub: string
}

/**
 * Generate a new Nostr keypair
 */
export function generateKeyPair(): NostrKeyPair {
  const privateKey = generateSecretKey()
  const publicKey = getPublicKey(privateKey)
  
  return {
    privateKey,
    publicKey,
    nsec: nip19.nsecEncode(privateKey),
    npub: nip19.npubEncode(publicKey),
  }
}

/**
 * Get public key from private key
 */
export function getPublicKeyFromPrivate(privateKey: Uint8Array | string): string {
  const sk = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey
  return getPublicKey(sk)
}

/**
 * Convert hex public key to npub
 */
export function hexToNpub(hex: string): string {
  return nip19.npubEncode(hex)
}

/**
 * Convert npub to hex public key
 */
export function npubToHex(npub: string): string {
  const { type, data } = nip19.decode(npub)
  if (type !== 'npub') {
    throw new Error('Invalid npub format')
  }
  return data as string
}

/**
 * Convert hex private key to nsec
 */
export function hexToNsec(hex: string): string {
  return nip19.nsecEncode(hexToBytes(hex))
}

/**
 * Convert nsec to hex private key
 */
export function nsecToHex(nsec: string): string {
  const { type, data } = nip19.decode(nsec)
  if (type !== 'nsec') {
    throw new Error('Invalid nsec format')
  }
  return bytesToHex(data as Uint8Array)
}

/**
 * Validate npub format
 */
export function isValidNpub(npub: string): boolean {
  try {
    const { type } = nip19.decode(npub)
    return type === 'npub'
  } catch {
    return false
  }
}

/**
 * Validate nsec format
 */
export function isValidNsec(nsec: string): boolean {
  try {
    const { type } = nip19.decode(nsec)
    return type === 'nsec'
  } catch {
    return false
  }
}

/**
 * Validate hex public key format (64 hex chars)
 */
export function isValidHexPubkey(hex: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hex)
}

/**
 * Shorten npub for display (e.g., npub1abc...xyz)
 */
export function shortenNpub(npub: string, chars: number = 8): string {
  if (npub.length <= chars * 2 + 3) return npub
  return `${npub.slice(0, chars + 5)}...${npub.slice(-chars)}`
}
