/**
 * NIP-46: Nostr Connect (Remote Signer)
 * Supports nsecBunker and other NIP-46 compatible signers
 */

import { 
  generateSecretKey, 
  getPublicKey,
  finalizeEvent,
  type Event,
  type UnsignedEvent
} from 'nostr-tools'
import { nip04 } from 'nostr-tools'

// Inline utils to avoid @noble/hashes subpath resolution issues in Next.js
const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

const hexToBytes = (hex: string): Uint8Array => {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) arr[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return arr
}

export interface Nip46ConnectionParams {
  remotePubkey: string      // Remote signer's pubkey
  relayUrl: string          // Relay for communication
  secret?: string           // Optional shared secret
}

export interface Nip46Request {
  id: string
  method: string
  params: string[]
}

export interface Nip46Response {
  id: string
  result?: string
  error?: string
}

export type Nip46Status = 'disconnected' | 'connecting' | 'connected' | 'error'

const NIP46_LOCAL_KEY_PREFIX = 'habit-tracker-nip46-local-key:'

function getStableStorageKey(params: Nip46ConnectionParams): string {
  return `${NIP46_LOCAL_KEY_PREFIX}${params.remotePubkey}:${params.relayUrl}`
}

function loadOrCreateLocalSecretKey(params: Nip46ConnectionParams): Uint8Array {
  // Mobile Amber/nsec.app treat every fresh local pubkey as a new bunker connection.
  // Reuse one local key per remote signer + relay so relogins/reloads do not
  // accumulate duplicate connections for the same habits.fabriok.ar origin.
  if (typeof window === 'undefined') {
    return generateSecretKey()
  }

  const storageKey = getStableStorageKey(params)
  const stored = window.localStorage.getItem(storageKey)

  if (stored && /^[0-9a-fA-F]{64}$/.test(stored)) {
    return hexToBytes(stored)
  }

  const secretKey = generateSecretKey()
  window.localStorage.setItem(storageKey, bytesToHex(secretKey))
  return secretKey
}

/**
 * Parse a bunker:// or nostrconnect:// URI
 * Format: bunker://<remote-pubkey>?relay=<relay-url>&secret=<secret>
 */
export function parseConnectionString(connectionString: string): Nip46ConnectionParams {
  // Support both bunker:// and nostrconnect:// schemes
  const normalizedUri = connectionString
    .replace(/^nostrconnect:\/\//, 'bunker://')
    .trim()
  
  if (!normalizedUri.startsWith('bunker://')) {
    throw new Error('Invalid connection string. Expected bunker:// or nostrconnect:// URI')
  }
  
  try {
    const url = new URL(normalizedUri)
    const remotePubkey = url.hostname || url.pathname.replace(/^\/\//, '')
    const relayUrl = url.searchParams.get('relay')
    const secret = url.searchParams.get('secret') || undefined
    
    if (!remotePubkey || remotePubkey.length !== 64) {
      throw new Error('Invalid remote pubkey in connection string')
    }
    
    if (!relayUrl) {
      throw new Error('Missing relay parameter in connection string')
    }
    
    return {
      remotePubkey,
      relayUrl: decodeURIComponent(relayUrl),
      secret,
    }
  } catch (error: any) {
    if (error.message.includes('Invalid')) {
      throw error
    }
    throw new Error('Failed to parse connection string')
  }
}

/**
 * NIP-46 Remote Signer Client
 */
export class Nip46Client {
  private localSecretKey: Uint8Array
  private localPubkey: string
  private remotePubkey: string
  private relayUrl: string
  private secret?: string
  private ws: WebSocket | null = null
  private status: Nip46Status = 'disconnected'
  private pendingRequests: Map<string, {
    resolve: (value: string) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }> = new Map()
  private subscriptionId: string | null = null
  private userPubkey: string | null = null
  private onStatusChange?: (status: Nip46Status) => void

  constructor(params: Nip46ConnectionParams, onStatusChange?: (status: Nip46Status) => void) {
    this.localSecretKey = loadOrCreateLocalSecretKey(params)
    this.localPubkey = getPublicKey(this.localSecretKey)
    this.remotePubkey = params.remotePubkey
    this.relayUrl = params.relayUrl
    this.secret = params.secret
    this.onStatusChange = onStatusChange
  }

  private setStatus(status: Nip46Status) {
    this.status = status
    this.onStatusChange?.(status)
  }

  getStatus(): Nip46Status {
    return this.status
  }

  getLocalPubkey(): string {
    return this.localPubkey
  }

  /**
   * Connect to the remote signer
   */
  async connect(timeoutMs: number = 30000): Promise<string> {
    if (this.status === 'connected' && this.userPubkey) {
      return this.userPubkey
    }

    this.setStatus('connecting')

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.disconnect()
        reject(new Error('Connection timeout'))
      }, timeoutMs)

      try {
        this.ws = new WebSocket(this.relayUrl)

        this.ws.onopen = async () => {
          // Subscribe to responses from the remote signer
          this.subscriptionId = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          const subMsg = JSON.stringify([
            'REQ',
            this.subscriptionId,
            {
              kinds: [24133],
              '#p': [this.localPubkey],
              authors: [this.remotePubkey],
              since: Math.floor(Date.now() / 1000) - 60,
            },
          ])
          this.ws!.send(subMsg)

          // Request connection
          try {
            const params = this.secret 
              ? [this.localPubkey, this.secret]
              : [this.localPubkey]
            
            const result = await this.sendRequest('connect', params, timeoutMs - 5000)
            
            // Get the user's pubkey after connecting
            this.userPubkey = await this.sendRequest('get_public_key', [], 10000)
            
            clearTimeout(timeout)
            this.setStatus('connected')
            resolve(this.userPubkey)
          } catch (err) {
            clearTimeout(timeout)
            this.disconnect()
            reject(err)
          }
        }

        this.ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg[0] === 'EVENT' && msg[2]?.kind === 24133) {
              await this.handleResponse(msg[2])
            }
          } catch (err) {
            console.error('[NIP-46] Failed to parse message:', err)
          }
        }

        this.ws.onerror = (error) => {
          clearTimeout(timeout)
          this.setStatus('error')
          reject(new Error('WebSocket error'))
        }

        this.ws.onclose = () => {
          if (this.status !== 'disconnected') {
            this.setStatus('disconnected')
          }
        }
      } catch (err) {
        clearTimeout(timeout)
        this.setStatus('error')
        reject(err)
      }
    })
  }

  private async handleResponse(event: Event) {
    try {
      const decrypted = await nip04.decrypt(
        this.localSecretKey,
        this.remotePubkey,
        event.content
      )
      
      const response: Nip46Response = JSON.parse(decrypted)
      const pending = this.pendingRequests.get(response.id)
      
      if (pending) {
        clearTimeout(pending.timeout)
        this.pendingRequests.delete(response.id)
        
        if (response.error) {
          pending.reject(new Error(response.error))
        } else if (response.result !== undefined) {
          pending.resolve(response.result)
        } else {
          pending.reject(new Error('Invalid response'))
        }
      }
    } catch (err) {
      console.error('[NIP-46] Failed to handle response:', err)
    }
  }

  private async sendRequest(method: string, params: string[], timeoutMs: number = 30000): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to relay')
    }

    const id = crypto.randomUUID()
    const request: Nip46Request = { id, method, params }
    
    // Encrypt the request
    const encrypted = await nip04.encrypt(
      this.localSecretKey,
      this.remotePubkey,
      JSON.stringify(request)
    )

    // Create and sign the event
    const unsignedEvent: UnsignedEvent = {
      kind: 24133,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.remotePubkey]],
      content: encrypted,
      pubkey: this.localPubkey,
    }
    
    const signedEvent = finalizeEvent(unsignedEvent, this.localSecretKey)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error(`Request timeout: ${method}`))
      }, timeoutMs)

      this.pendingRequests.set(id, { resolve, reject, timeout })
      
      this.ws!.send(JSON.stringify(['EVENT', signedEvent]))
    })
  }

  /**
   * Get public key from remote signer
   */
  async getPublicKey(): Promise<string> {
    if (this.userPubkey) return this.userPubkey
    return this.sendRequest('get_public_key', [])
  }

  /**
   * Sign an event using remote signer
   */
  async signEvent(event: UnsignedEvent): Promise<Event> {
    const eventJson = JSON.stringify(event)
    const signedJson = await this.sendRequest('sign_event', [eventJson])
    return JSON.parse(signedJson)
  }

  /**
   * Encrypt using NIP-04 via remote signer
   */
  async nip04Encrypt(pubkey: string, plaintext: string): Promise<string> {
    return this.sendRequest('nip04_encrypt', [pubkey, plaintext])
  }

  /**
   * Decrypt using NIP-04 via remote signer
   */
  async nip04Decrypt(pubkey: string, ciphertext: string): Promise<string> {
    return this.sendRequest('nip04_decrypt', [pubkey, ciphertext])
  }

  /**
   * Disconnect from remote signer
   */
  disconnect() {
    // Clear pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Disconnected'))
    }
    this.pendingRequests.clear()

    // Close websocket
    if (this.ws) {
      if (this.subscriptionId) {
        try {
          this.ws.send(JSON.stringify(['CLOSE', this.subscriptionId]))
        } catch {
          // Ignore errors when closing
        }
      }
      this.ws.close()
      this.ws = null
    }

    this.subscriptionId = null
    this.userPubkey = null
    this.setStatus('disconnected')
  }
}

/**
 * Validate a connection string format
 */
export function isValidConnectionString(str: string): boolean {
  try {
    parseConnectionString(str)
    return true
  } catch {
    return false
  }
}
