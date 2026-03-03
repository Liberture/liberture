"use client"

import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from "nostr-tools/pure"
import { Relay } from "nostr-tools/relay"
import { nip04 } from "nostr-tools"

// Hex conversion utilities
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

export interface BunkerConnection {
  pubkey: string // Remote signer pubkey (hex)
  relayUrl: string
  secret?: string // Optional shared secret for auth
  clientSecretKey: Uint8Array
  clientPubkey: string
}

export interface Nip46Signer {
  getPublicKey(): Promise<string>
  signEvent(event: { kind: number; created_at: number; tags: string[][]; content: string }): Promise<{
    id: string
    pubkey: string
    created_at: number
    kind: number
    tags: string[][]
    content: string
    sig: string
  }>
  close(): void
}

// Parse bunker:// URL
// Format: bunker://<remote-signer-pubkey>?relay=<relay-url>&secret=<optional-secret>
export function parseBunkerUrl(url: string): { pubkey: string; relayUrl: string; secret?: string } | null {
  try {
    if (!url.startsWith("bunker://")) return null
    
    const parsed = new URL(url.replace("bunker://", "https://"))
    const pubkey = parsed.hostname
    const relayUrl = parsed.searchParams.get("relay")
    const secret = parsed.searchParams.get("secret") || undefined

    if (!pubkey || !relayUrl) return null
    
    // Validate pubkey is 64 char hex
    if (!/^[0-9a-f]{64}$/i.test(pubkey)) return null

    return { pubkey, relayUrl, secret }
  } catch {
    return null
  }
}

// Generate nostrconnect:// URL for mobile signers to scan
// Format: nostrconnect://<client-pubkey>?relay=<relay-url>&metadata=<app-metadata>
export function generateNostrConnectUrl(
  clientPubkey: string,
  relayUrl: string,
  appName: string = "Liberture",
  appUrl: string = "https://liberture.com"
): string {
  const metadata = JSON.stringify({
    name: appName,
    url: appUrl,
    description: "Biological Operating System"
  })
  
  const params = new URLSearchParams({
    relay: relayUrl,
    metadata
  })
  
  return `nostrconnect://${clientPubkey}?${params.toString()}`
}

// Default relay for NIP-46 connections
export const DEFAULT_NIP46_RELAY = "wss://relay.nsec.app"

export class Nip46Client implements Nip46Signer {
  private connection: BunkerConnection
  private relay: Relay | null = null
  private pendingRequests: Map<string, { resolve: (result: any) => void; reject: (error: Error) => void }> = new Map()
  private remotePubkey: string | null = null
  private subscriptionId: string | null = null

  constructor(connection: BunkerConnection) {
    this.connection = connection
  }

  async connect(): Promise<void> {
    this.relay = await Relay.connect(this.connection.relayUrl)
    
    // Subscribe to responses from the remote signer
    const sub = this.relay.subscribe(
      [
        {
          kinds: [24133],
          "#p": [this.connection.clientPubkey],
          authors: [this.connection.pubkey]
        }
      ],
      {
        onevent: async (event) => {
          try {
            const decrypted = await nip04.decrypt(
              this.connection.clientSecretKey,
              event.pubkey,
              event.content
            )
            const response = JSON.parse(decrypted)
            
            const pending = this.pendingRequests.get(response.id)
            if (pending) {
              if (response.error) {
                pending.reject(new Error(response.error))
              } else {
                pending.resolve(response.result)
              }
              this.pendingRequests.delete(response.id)
            }
          } catch (e) {
            console.error("Failed to process NIP-46 response:", e)
          }
        }
      }
    )
    
    // If we have a secret, send connect request
    if (this.connection.secret) {
      await this.sendRequest("connect", [this.connection.pubkey, this.connection.secret])
    }
  }

  private async sendRequest(method: string, params: string[]): Promise<any> {
    if (!this.relay) throw new Error("Not connected")

    const id = Math.random().toString(36).substring(2, 15)
    const request = JSON.stringify({ id, method, params })
    
    const encrypted = await nip04.encrypt(
      this.connection.clientSecretKey,
      this.connection.pubkey,
      request
    )

    const event = finalizeEvent(
      {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", this.connection.pubkey]],
        content: encrypted
      },
      this.connection.clientSecretKey
    )

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
      
      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error("Request timed out"))
        }
      }, 60000)

      this.relay!.publish(event).catch(reject)
    })
  }

  async getPublicKey(): Promise<string> {
    if (this.remotePubkey) return this.remotePubkey
    this.remotePubkey = await this.sendRequest("get_public_key", [])
    return this.remotePubkey!
  }

  async signEvent(event: { kind: number; created_at: number; tags: string[][]; content: string }) {
    const result = await this.sendRequest("sign_event", [JSON.stringify(event)])
    return typeof result === "string" ? JSON.parse(result) : result
  }

  close(): void {
    this.relay?.close()
    this.pendingRequests.clear()
  }
}

// Create a NIP-46 client from bunker:// URL
export async function createBunkerClient(bunkerUrl: string): Promise<Nip46Client> {
  const parsed = parseBunkerUrl(bunkerUrl)
  if (!parsed) throw new Error("Invalid bunker URL")

  const clientSecretKey = generateSecretKey()
  const clientPubkey = getPublicKey(clientSecretKey)

  const connection: BunkerConnection = {
    pubkey: parsed.pubkey,
    relayUrl: parsed.relayUrl,
    secret: parsed.secret,
    clientSecretKey,
    clientPubkey
  }

  const client = new Nip46Client(connection)
  await client.connect()
  
  return client
}

// Create connection info for nostrconnect:// flow
export function createNostrConnectSession(relayUrl: string = DEFAULT_NIP46_RELAY): {
  clientSecretKey: Uint8Array
  clientPubkey: string
  connectUrl: string
} {
  const clientSecretKey = generateSecretKey()
  const clientPubkey = getPublicKey(clientSecretKey)
  const connectUrl = generateNostrConnectUrl(clientPubkey, relayUrl)

  return { clientSecretKey, clientPubkey, connectUrl }
}

// Wait for remote signer to connect via nostrconnect://
export async function waitForNostrConnect(
  clientSecretKey: Uint8Array,
  clientPubkey: string,
  relayUrl: string = DEFAULT_NIP46_RELAY,
  timeoutMs: number = 120000
): Promise<Nip46Client> {
  const relay = await Relay.connect(relayUrl)
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      relay.close()
      reject(new Error("Connection timed out"))
    }, timeoutMs)

    relay.subscribe(
      [
        {
          kinds: [24133],
          "#p": [clientPubkey]
        }
      ],
      {
        onevent: async (event) => {
          try {
            const decrypted = await nip04.decrypt(clientSecretKey, event.pubkey, event.content)
            const request = JSON.parse(decrypted)
            
            // Remote signer sends "connect" request when scanning QR
            if (request.method === "connect") {
              clearTimeout(timeout)
              relay.close()

              const connection: BunkerConnection = {
                pubkey: event.pubkey,
                relayUrl,
                clientSecretKey,
                clientPubkey
              }

              const client = new Nip46Client(connection)
              await client.connect()
              resolve(client)
            }
          } catch (e) {
            console.error("Error processing connect request:", e)
          }
        }
      }
    )
  })
}

// Store/retrieve bunker connection in sessionStorage
const BUNKER_STORAGE_KEY = "liberture_nip46_connection"

export function storeBunkerConnection(connection: Omit<BunkerConnection, "clientSecretKey"> & { clientSecretKeyHex: string }): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(BUNKER_STORAGE_KEY, JSON.stringify(connection))
  }
}

export function getBunkerConnection(): BunkerConnection | null {
  if (typeof window === "undefined") return null
  
  const stored = sessionStorage.getItem(BUNKER_STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    return {
      ...parsed,
      clientSecretKey: hexToBytes(parsed.clientSecretKeyHex)
    }
  } catch {
    return null
  }
}

export function clearBunkerConnection(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(BUNKER_STORAGE_KEY)
  }
}
