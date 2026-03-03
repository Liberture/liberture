"use client"

import { generateSecretKey, getPublicKey, finalizeEvent } from "nostr-tools/pure"
import { Relay } from "nostr-tools/relay"
import * as nip04 from "nostr-tools/nip04"
import * as nip44 from "nostr-tools/nip44"

// Decrypt using NIP-44 or NIP-04 (auto-detect based on content format)
async function decryptNip46(secretKey: Uint8Array, pubkey: string, content: string): Promise<string> {
  // NIP-44 content starts with version byte (base64 of 0x02 = "Ag")
  if (content.startsWith("A")) {
    try {
      const conversationKey = nip44.v2.utils.getConversationKey(secretKey, pubkey)
      return nip44.v2.decrypt(content, conversationKey)
    } catch (e) {
      console.log("[NIP-46] NIP-44 decrypt failed, trying NIP-04:", e)
    }
  }
  
  // Fall back to NIP-04
  const secretKeyHex = bytesToHex(secretKey)
  return nip04.decrypt(secretKeyHex, pubkey, content)
}

// Encrypt using NIP-44 (preferred) with NIP-04 fallback
async function encryptNip46(secretKey: Uint8Array, pubkey: string, plaintext: string): Promise<string> {
  try {
    const conversationKey = nip44.v2.utils.getConversationKey(secretKey, pubkey)
    return nip44.v2.encrypt(plaintext, conversationKey)
  } catch (e) {
    console.log("[NIP-46] NIP-44 encrypt failed, using NIP-04:", e)
    const secretKeyHex = bytesToHex(secretKey)
    return nip04.encrypt(secretKeyHex, pubkey, plaintext)
  }
}

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
  private connected: boolean = false

  constructor(connection: BunkerConnection) {
    this.connection = connection
  }

  async connect(): Promise<void> {
    console.log("[NIP-46] Connecting to relay:", this.connection.relayUrl)
    this.relay = await Relay.connect(this.connection.relayUrl)
    console.log("[NIP-46] Connected to relay")
    
    // Subscribe to responses from the remote signer
    this.relay.subscribe(
      [
        {
          kinds: [24133],
          "#p": [this.connection.clientPubkey],
          since: Math.floor(Date.now() / 1000) - 60 // Only recent events
        }
      ],
      {
        onevent: async (event) => {
          try {
            console.log("[NIP-46] Received event from:", event.pubkey)
            const decrypted = await decryptNip46(
              this.connection.clientSecretKey,
              event.pubkey,
              event.content
            )
            console.log("[NIP-46] Decrypted response:", decrypted)
            const response = JSON.parse(decrypted)
            
            const pending = this.pendingRequests.get(response.id)
            if (pending) {
              if (response.error) {
                console.error("[NIP-46] Request error:", response.error)
                pending.reject(new Error(response.error))
              } else {
                console.log("[NIP-46] Request success:", response.result)
                pending.resolve(response.result)
              }
              this.pendingRequests.delete(response.id)
            }
          } catch (e) {
            console.error("[NIP-46] Failed to process response:", e)
          }
        }
      }
    )
    
    // If we have a secret, send connect request and wait for ack
    if (this.connection.secret) {
      console.log("[NIP-46] Sending connect with secret")
      try {
        const result = await this.sendRequest("connect", [this.connection.pubkey, this.connection.secret])
        console.log("[NIP-46] Connect result:", result)
        this.connected = true
      } catch (e) {
        console.error("[NIP-46] Connect failed:", e)
        throw e
      }
    } else {
      // No secret means we're already authorized (nostrconnect flow)
      this.connected = true
    }
  }

  private async sendRequest(method: string, params: string[]): Promise<any> {
    if (!this.relay) throw new Error("Not connected to relay")

    const id = Math.random().toString(36).substring(2, 15)
    const request = JSON.stringify({ id, method, params })
    
    console.log("[NIP-46] Sending request:", method, params)
    
    const encrypted = await encryptNip46(
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
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error("Request timed out"))
        }
      }, 60000)

      this.relay!.publish(event)
        .then(() => console.log("[NIP-46] Event published"))
        .catch((e) => {
          clearTimeout(timeout)
          this.pendingRequests.delete(id)
          reject(e)
        })
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
    this.connected = false
  }
}

// Create a NIP-46 client from bunker:// URL
export async function createBunkerClient(bunkerUrl: string): Promise<Nip46Client> {
  const parsed = parseBunkerUrl(bunkerUrl)
  if (!parsed) throw new Error("Invalid bunker URL")

  console.log("[NIP-46] Creating bunker client for:", parsed.pubkey)

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

  console.log("[NIP-46] Created nostrconnect session, pubkey:", clientPubkey)

  return { clientSecretKey, clientPubkey, connectUrl }
}

// Wait for remote signer to connect via nostrconnect://
export async function waitForNostrConnect(
  clientSecretKey: Uint8Array,
  clientPubkey: string,
  relayUrl: string = DEFAULT_NIP46_RELAY,
  timeoutMs: number = 120000
): Promise<Nip46Client> {
  console.log("[NIP-46] Waiting for nostrconnect on relay:", relayUrl)
  const relay = await Relay.connect(relayUrl)
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log("[NIP-46] Connection timed out")
      relay.close()
      reject(new Error("Connection timed out"))
    }, timeoutMs)

    relay.subscribe(
      [
        {
          kinds: [24133],
          "#p": [clientPubkey],
          since: Math.floor(Date.now() / 1000) - 10
        }
      ],
      {
        onevent: async (event) => {
          console.log("[NIP-46] Received event from:", event.pubkey)
          console.log("[NIP-46] Event content:", event.content)
          try {
            const decrypted = await decryptNip46(clientSecretKey, event.pubkey, event.content)
            console.log("[NIP-46] Decrypted:", decrypted)
            const request = JSON.parse(decrypted)
            
            // Remote signer sends "connect" request when scanning QR
            if (request.method === "connect") {
              console.log("[NIP-46] Received connect request from signer")
              
              // Send acknowledgment back to the signer
              const ackResponse = JSON.stringify({
                id: request.id,
                result: "ack"
              })
              
              const encryptedAck = await encryptNip46(
                clientSecretKey,
                event.pubkey,
                ackResponse
              )
              
              const ackEvent = finalizeEvent(
                {
                  kind: 24133,
                  created_at: Math.floor(Date.now() / 1000),
                  tags: [["p", event.pubkey]],
                  content: encryptedAck
                },
                clientSecretKey
              )
              
              await relay.publish(ackEvent)
              console.log("[NIP-46] Sent ack to signer")
              
              clearTimeout(timeout)
              relay.close()

              // Create new client for ongoing communication
              const connection: BunkerConnection = {
                pubkey: event.pubkey,
                relayUrl,
                clientSecretKey,
                clientPubkey
              }

              const client = new Nip46Client(connection)
              await client.connect()
              console.log("[NIP-46] Client connected successfully")
              resolve(client)
            }
          } catch (e) {
            console.error("[NIP-46] Error processing connect request:", e)
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
