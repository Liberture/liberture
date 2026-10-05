"use client"

/**
 * Nostr Authentication Context
 * Manages NIP-07 (extension) and NIP-46 (remote signer) auth states
 * Implements challenge-response authentication (NIP-98 style)
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Event, UnsignedEvent } from 'nostr-tools'
import { hexToNpub } from './crypto'
import { hasNip07Extension, waitForNip07, nip07GetPublicKey, nip07SignEvent } from './nip07'
import { Nip46Client, parseConnectionString, type Nip46Status } from './nip46'
import { buildAuthEvent } from '@/lib/habits/nostr/auth-event'

// Storage keys
const NOSTR_AUTH_KEY = 'habit-tracker-nostr-auth'
const NOSTR_SESSION_TOKEN_KEY = 'habit-tracker-nostr-session'

export type NostrAuthMethod = 'nip07' | 'nip46' | null

export interface NostrAuthState {
  method: NostrAuthMethod
  pubkey: string | null       // hex
  npub: string | null
  nip46ConnectionString?: string
}

export interface NostrAuthContextValue {
  // State
  isAuthenticated: boolean
  isLoading: boolean
  authMethod: NostrAuthMethod
  pubkey: string | null
  npub: string | null
  nip46Status: Nip46Status
  hasExtension: boolean
  
  // Actions
  loginWithExtension: () => Promise<void>
  loginWithNip46: (connectionString: string) => Promise<void>
  logout: () => void
  signEvent: (event: UnsignedEvent) => Promise<Event>
  
  // Error handling
  error: string | null
  clearError: () => void
}

const NostrAuthContext = createContext<NostrAuthContextValue | null>(null)

export function useNostrAuth(): NostrAuthContextValue {
  const context = useContext(NostrAuthContext)
  if (!context) {
    throw new Error('useNostrAuth must be used within NostrAuthProvider')
  }
  return context
}

interface NostrAuthProviderProps {
  children: ReactNode
}

/**
 * Request a challenge nonce from the server
 */
async function requestChallenge(pubkey: string): Promise<string> {
  const response = await fetch(`/api/auth/nostr/challenge?pubkey=${encodeURIComponent(pubkey)}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to request challenge' }))
    throw new Error(error.error || 'Failed to request challenge')
  }
  
  const { challenge } = await response.json()
  if (!challenge) {
    throw new Error('Server did not return a challenge')
  }
  
  return challenge
}

/**
 * Create an unsigned auth event with the challenge
 */
function createAuthEvent(pubkey: string, challenge: string): UnsignedEvent {
  return { ...buildAuthEvent(challenge, '/api/auth/nostr'), pubkey }
}

/**
 * Submit the signed auth event to the server
 * Returns the session token for persistent auth
 */
async function submitSignedEvent(pubkey: string, signedEvent: Event): Promise<string> {
  const response = await fetch('/api/auth/nostr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pubkey, signedEvent }),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Authentication failed' }))
    throw new Error(error.error || 'Authentication failed')
  }

  const data = await response.json()
  return data.sessionToken || ''
}

/**
 * Verify a session token with the server
 * Returns pubkey if valid, null otherwise
 */
async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const response = await fetch(`/api/auth/nostr/session?token=${encodeURIComponent(token)}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    if (!response.ok) return null
    const data = await response.json()
    return data.valid ? data.pubkey : null
  } catch {
    return null
  }
}

/**
 * Full challenge-response authentication flow
 * Returns the session token for persistent auth
 */
async function performChallengeAuth(
  pubkey: string,
  signEvent: (event: UnsignedEvent) => Promise<Event>
): Promise<string> {
  // Step 1: Request challenge from server
  const challenge = await requestChallenge(pubkey)
  
  // Step 2: Create and sign the auth event
  const unsignedEvent = createAuthEvent(pubkey, challenge)
  const signedEvent = await signEvent(unsignedEvent)
  
  // Step 3: Submit signed event to server for verification
  // Returns session token for persistent auth
  return submitSignedEvent(pubkey, signedEvent)
}

export function NostrAuthProvider({ children }: NostrAuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [authMethod, setAuthMethod] = useState<NostrAuthMethod>(null)
  const [pubkey, setPubkey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasExtension, setHasExtension] = useState(false)
  const [nip46Client, setNip46Client] = useState<Nip46Client | null>(null)
  const [nip46Status, setNip46Status] = useState<Nip46Status>('disconnected')
  const [nip46ConnectionString, setNip46ConnectionString] = useState<string | null>(null)

  const npub = pubkey ? hexToNpub(pubkey) : null
  const isAuthenticated = !!pubkey

  // Check for NIP-07 extension on mount
  useEffect(() => {
    waitForNip07(2000).then(setHasExtension)
  }, [])

  // Restore auth state from localStorage
  // Priority: session token (fast, no signer needed) > signer re-auth (slow)
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        // First, try to restore via session token (fast path - no signer needed)
        const sessionToken = localStorage.getItem(NOSTR_SESSION_TOKEN_KEY)
        const stored = localStorage.getItem(NOSTR_AUTH_KEY)
        
        if (sessionToken) {
          const pubkeyFromSession = await verifySessionToken(sessionToken)
          if (pubkeyFromSession) {
            // Session is valid! Restore auth without needing signer
            const state: NostrAuthState | null = stored ? JSON.parse(stored) : null
            setPubkey(pubkeyFromSession)
            setAuthMethod(state?.method || 'nip07')
            
            // For NIP-46, store the connection string but DON'T connect yet
            // We'll connect lazily when signing is actually needed
            if (state?.method === 'nip46' && state.nip46ConnectionString) {
              setNip46ConnectionString(state.nip46ConnectionString)
            }
            
            setIsLoading(false)
            return
          }
          // Session token invalid/expired, clear it
          localStorage.removeItem(NOSTR_SESSION_TOKEN_KEY)
        }

        // No valid session token - try signer re-auth (slow path)
        if (!stored) {
          setIsLoading(false)
          return
        }

        const state: NostrAuthState = JSON.parse(stored)
        
        if (state.method === 'nip07' && state.pubkey) {
          // Verify extension is still available and has same key
          const extensionAvailable = await waitForNip07(2000)
          if (extensionAvailable) {
            try {
              const currentPubkey = await nip07GetPublicKey()
              if (currentPubkey === state.pubkey) {
                // Re-authenticate with challenge-response
                const newSessionToken = await performChallengeAuth(currentPubkey, nip07SignEvent)
                localStorage.setItem(NOSTR_SESSION_TOKEN_KEY, newSessionToken)
                setPubkey(state.pubkey)
                setAuthMethod('nip07')
              } else {
                // Different key, clear stored auth
                localStorage.removeItem(NOSTR_AUTH_KEY)
              }
            } catch {
              // Extension rejected or errored, clear auth
              localStorage.removeItem(NOSTR_AUTH_KEY)
            }
          } else {
            // Extension no longer available - but don't clear auth!
            // User might have temporarily disabled extension
            // Just stay logged out for this session, don't wipe their data
            console.log('[Nostr Auth] Extension not available, session will require re-login')
          }
        } else if (state.method === 'nip46' && state.pubkey && state.nip46ConnectionString) {
          // For NIP-46 without a valid session token, we need to reconnect and re-auth
          // But this is expensive and may fail on mobile - try with longer timeout
          try {
            const params = parseConnectionString(state.nip46ConnectionString)
            const client = new Nip46Client(params, setNip46Status)
            const remotePubkey = await client.connect(30000) // 30s timeout for mobile
            
            if (remotePubkey === state.pubkey) {
              // Re-authenticate with challenge-response
              const newSessionToken = await performChallengeAuth(remotePubkey, (event) => client.signEvent(event))
              localStorage.setItem(NOSTR_SESSION_TOKEN_KEY, newSessionToken)
              setNip46Client(client)
              setNip46ConnectionString(state.nip46ConnectionString)
              setPubkey(state.pubkey)
              setAuthMethod('nip46')
            } else {
              // Different pubkey, clear stored auth
              client.disconnect()
              localStorage.removeItem(NOSTR_AUTH_KEY)
            }
          } catch (err) {
            // Failed to reconnect - but DON'T clear auth!
            // Mobile user might have Amber app closed
            // They can try again later
            console.log('[Nostr Auth] NIP-46 reconnect failed, user may need to re-login:', err)
          }
        }
      } catch {
        // Parse error or other issue
        localStorage.removeItem(NOSTR_AUTH_KEY)
        localStorage.removeItem(NOSTR_SESSION_TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    restoreAuth()
  }, [])

  // Save auth state to localStorage
  const saveAuthState = useCallback((state: NostrAuthState) => {
    localStorage.setItem(NOSTR_AUTH_KEY, JSON.stringify(state))
  }, [])

  // Login with NIP-07 extension
  const loginWithExtension = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const available = await waitForNip07(3000)
      if (!available) {
        throw new Error('No Nostr extension found. Please install Alby, nos2x, or another Nostr signer extension.')
      }

      // Get public key from extension
      const pk = await nip07GetPublicKey()
      
      // Perform challenge-response authentication (returns session token)
      const sessionToken = await performChallengeAuth(pk, nip07SignEvent)
      
      // Store session token for persistent auth (survives page reloads)
      if (sessionToken) {
        localStorage.setItem(NOSTR_SESSION_TOKEN_KEY, sessionToken)
      }
      
      // Authentication successful
      setPubkey(pk)
      setAuthMethod('nip07')
      saveAuthState({ method: 'nip07', pubkey: pk, npub: hexToNpub(pk) })
    } catch (err: any) {
      setError(err.message || 'Failed to connect to extension')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [saveAuthState])

  // Login with NIP-46 remote signer
  const loginWithNip46 = useCallback(async (connectionString: string) => {
    setError(null)
    setIsLoading(true)

    // Disconnect existing client if any
    if (nip46Client) {
      nip46Client.disconnect()
      setNip46Client(null)
    }

    try {
      const params = parseConnectionString(connectionString)
      const client = new Nip46Client(params, setNip46Status)
      
      // Connect to remote signer and get pubkey
      const pk = await client.connect(30000)
      
      // Perform challenge-response authentication (returns session token)
      const sessionToken = await performChallengeAuth(pk, (event) => client.signEvent(event))
      
      // Store session token for persistent auth (survives page reloads without needing signer)
      if (sessionToken) {
        localStorage.setItem(NOSTR_SESSION_TOKEN_KEY, sessionToken)
      }
      
      // Authentication successful
      setNip46Client(client)
      setNip46ConnectionString(connectionString)
      setPubkey(pk)
      setAuthMethod('nip46')
      saveAuthState({
        method: 'nip46',
        pubkey: pk,
        npub: hexToNpub(pk),
        nip46ConnectionString: connectionString,
      })
    } catch (err: any) {
      setNip46Status('error')
      setError(err.message || 'Failed to connect to remote signer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [nip46Client, saveAuthState])

  // Sign an event using the current auth method
  const signEvent = useCallback(async (event: UnsignedEvent): Promise<Event> => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    if (authMethod === 'nip07') {
      return nip07SignEvent(event)
    } else if (authMethod === 'nip46' && nip46Client) {
      return nip46Client.signEvent(event)
    }

    throw new Error('No signing method available')
  }, [isAuthenticated, authMethod, nip46Client])

  // Logout
  const logout = useCallback(async () => {
    // Invalidate session on server
    const sessionToken = localStorage.getItem(NOSTR_SESSION_TOKEN_KEY)
    if (sessionToken) {
      try {
        await fetch(`/api/auth/nostr/session?token=${encodeURIComponent(sessionToken)}`, {
          method: 'DELETE',
        })
      } catch {
        // Ignore errors - we're logging out anyway
      }
    }

    if (nip46Client) {
      nip46Client.disconnect()
      setNip46Client(null)
    }
    
    setPubkey(null)
    setAuthMethod(null)
    setNip46ConnectionString(null)
    setNip46Status('disconnected')
    setError(null)
    localStorage.removeItem(NOSTR_AUTH_KEY)
    localStorage.removeItem(NOSTR_SESSION_TOKEN_KEY)
  }, [nip46Client])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nip46Client) {
        nip46Client.disconnect()
      }
    }
  }, [nip46Client])

  const value: NostrAuthContextValue = {
    isAuthenticated,
    isLoading,
    authMethod,
    pubkey,
    npub,
    nip46Status,
    hasExtension,
    loginWithExtension,
    loginWithNip46,
    logout,
    signEvent,
    error,
    clearError,
  }

  return (
    <NostrAuthContext.Provider value={value}>
      {children}
    </NostrAuthContext.Provider>
  )
}
