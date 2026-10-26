"use client"

/**
 * Nostr session state for the whole site.
 *
 * Signing in happens in the sign-in dialog (components/habits/sign-in-dialog.tsx),
 * which ends with the server setting an httpOnly session cookie. This provider
 * only restores that session on load and ends it on logout. The token never
 * reaches page JavaScript, so a script injected into a page can't carry it off.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { hexToNpub } from './crypto'

// Non-secret hints written by the session provider (components/habits/session-provider.tsx).
// They only decide whether asking the server for a session is worth a request.
const AUTH_TYPE_KEY = 'habit-tracker-auth-type'
const PUBKEY_KEY = 'habit-tracker-nostr-pubkey'

// Older builds kept secrets in localStorage: the session token, the bunker URI
// (with its pairing secret), and the hand-rolled NIP-46 client's keys. Gone on load.
const LEGACY_KEYS = [
  'habit-tracker-nostr-session',
  'habit-tracker-nostr-auth',
  'habit-tracker-nip46-connection',
  'nostr_dev_logs',
  'nostr_dev_logging_settings',
]
const LEGACY_KEY_PREFIXES = ['habit-tracker-nip46-local-key:']

export type NostrAuthMethod = 'nip07' | 'nip46' | null

export interface NostrAuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  authMethod: NostrAuthMethod
  pubkey: string | null       // hex
  npub: string | null
  logout: () => Promise<void>
}

const NostrAuthContext = createContext<NostrAuthContextValue | null>(null)

export function useNostrAuth(): NostrAuthContextValue {
  const context = useContext(NostrAuthContext)
  if (!context) {
    throw new Error('useNostrAuth must be used within NostrAuthProvider')
  }
  return context
}

/** Reads the sign-in hint, and removes what older builds stored. */
function readHintAndCleanUp(): { hinted: boolean; method: NostrAuthMethod } {
  try {
    const type = localStorage.getItem(AUTH_TYPE_KEY)
    const hadLegacySession = !!localStorage.getItem('habit-tracker-nostr-session')
    const hinted =
      type === 'nip07' || type === 'nip46' || type === 'nsec' || !!localStorage.getItem(PUBKEY_KEY) || hadLegacySession

    for (const key of LEGACY_KEYS) localStorage.removeItem(key)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) localStorage.removeItem(key)
    }

    return { hinted, method: type === 'nip46' ? 'nip46' : 'nip07' }
  } catch {
    return { hinted: false, method: null }
  }
}

/**
 * Ask the server who the session cookie belongs to.
 * Returns the pubkey if valid, null otherwise.
 */
async function fetchSessionPubkey(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch('/api/auth/nostr/session', {
      signal: controller.signal,
      credentials: 'same-origin',
    })
    clearTimeout(timeoutId)

    if (!response.ok) return null
    const data = await response.json()
    return data.valid ? data.pubkey : null
  } catch {
    return null
  }
}

export function NostrAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [authMethod, setAuthMethod] = useState<NostrAuthMethod>(null)
  const [pubkey, setPubkey] = useState<string | null>(null)

  const npub = pubkey ? hexToNpub(pubkey) : null
  const isAuthenticated = !!pubkey

  // Restore the session from the cookie, when this browser signed in before.
  useEffect(() => {
    const restoreAuth = async () => {
      const { hinted, method } = readHintAndCleanUp()
      if (hinted) {
        const sessionPubkey = await fetchSessionPubkey()
        if (sessionPubkey) {
          setPubkey(sessionPubkey)
          setAuthMethod(method)
        }
      }
      setIsLoading(false)
    }

    restoreAuth()
  }, [])

  // Logout: the server drops the session and clears the cookie
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/nostr/session', { method: 'DELETE', credentials: 'same-origin' })
    } catch {
      // Ignore errors - we're logging out anyway
    }
    setPubkey(null)
    setAuthMethod(null)
  }, [])

  const value: NostrAuthContextValue = {
    isAuthenticated,
    isLoading,
    authMethod,
    pubkey,
    npub,
    logout,
  }

  return (
    <NostrAuthContext.Provider value={value}>
      {children}
    </NostrAuthContext.Provider>
  )
}
