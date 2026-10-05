/**
 * NIP-07: Browser extension interface (window.nostr)
 * Supports Alby, nos2x, Flamingo, etc.
 */

import type { Event, UnsignedEvent } from 'nostr-tools'

// NIP-07 window.nostr interface
export interface Nip07Interface {
  getPublicKey(): Promise<string>
  signEvent(event: UnsignedEvent): Promise<Event>
  getRelays?(): Promise<{ [url: string]: { read: boolean; write: boolean } }>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
}

declare global {
  interface Window {
    nostr?: Nip07Interface
  }
}

/**
 * Check if a NIP-07 extension is available
 */
export function hasNip07Extension(): boolean {
  return typeof window !== 'undefined' && typeof window.nostr !== 'undefined'
}

/**
 * Wait for NIP-07 extension to be available
 * Some extensions inject after page load
 */
export async function waitForNip07(timeoutMs: number = 3000): Promise<boolean> {
  if (hasNip07Extension()) return true
  
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const checkInterval = setInterval(() => {
      if (hasNip07Extension()) {
        clearInterval(checkInterval)
        resolve(true)
        return
      }
      
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
  })
}

/**
 * Get public key from NIP-07 extension
 */
export async function nip07GetPublicKey(): Promise<string> {
  if (!hasNip07Extension()) {
    throw new Error('No NIP-07 extension found. Please install Alby, nos2x, or another Nostr extension.')
  }
  
  try {
    const pubkey = await window.nostr!.getPublicKey()
    if (!pubkey || typeof pubkey !== 'string') {
      throw new Error('Extension returned invalid public key')
    }
    return pubkey
  } catch (error: any) {
    if (error.message?.includes('denied') || error.message?.includes('rejected')) {
      throw new Error('Permission denied by user')
    }
    throw error
  }
}

/**
 * Sign an event using NIP-07 extension
 */
export async function nip07SignEvent(event: UnsignedEvent): Promise<Event> {
  if (!hasNip07Extension()) {
    throw new Error('No NIP-07 extension found')
  }
  
  try {
    const signedEvent = await window.nostr!.signEvent(event)
    return signedEvent
  } catch (error: any) {
    if (error.message?.includes('denied') || error.message?.includes('rejected')) {
      throw new Error('Signing request denied by user')
    }
    throw error
  }
}

/**
 * Get user's preferred relays from extension
 */
export async function nip07GetRelays(): Promise<{ [url: string]: { read: boolean; write: boolean } } | null> {
  if (!hasNip07Extension() || !window.nostr!.getRelays) {
    return null
  }
  
  try {
    return await window.nostr!.getRelays()
  } catch {
    return null
  }
}

/**
 * Encrypt a message using NIP-04 (via extension)
 */
export async function nip07Encrypt(recipientPubkey: string, plaintext: string): Promise<string> {
  if (!hasNip07Extension() || !window.nostr!.nip04?.encrypt) {
    throw new Error('NIP-04 encryption not supported by extension')
  }
  
  return window.nostr!.nip04.encrypt(recipientPubkey, plaintext)
}

/**
 * Decrypt a message using NIP-04 (via extension)
 */
export async function nip07Decrypt(senderPubkey: string, ciphertext: string): Promise<string> {
  if (!hasNip07Extension() || !window.nostr!.nip04?.decrypt) {
    throw new Error('NIP-04 decryption not supported by extension')
  }
  
  return window.nostr!.nip04.decrypt(senderPubkey, ciphertext)
}
