"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import { useRouter } from "next/navigation"
import "@/types/nostr"
import { type Nip46Signer, getBunkerConnection, clearBunkerConnection, Nip46Client } from "@/lib/nip46"

interface User {
  id: string
  email: string
  name: string
  bosLevel: number
  nostrPubkey?: string
  role?: string
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginWithNostr: () => Promise<void>
  loginWithNip46: (signer: Nip46Signer) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const nip46SignerRef = useRef<Nip46Signer | null>(null)

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Restore NIP-46 connection from session storage
  useEffect(() => {
    const stored = getBunkerConnection()
    if (stored && !nip46SignerRef.current) {
      const client = new Nip46Client(stored)
      client.connect().then(() => {
        nip46SignerRef.current = client
      }).catch(console.error)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sign challenge using the available method
  const signChallenge = async (challenge: string, pubkey: string): Promise<{
    id: string
    pubkey: string
    created_at: number
    kind: number
    tags: string[][]
    content: string
    sig: string
  }> => {
    const unsignedEvent = {
      kind: 22242,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: challenge,
    }

    // Use NIP-46 signer if available
    if (nip46SignerRef.current) {
      return await nip46SignerRef.current.signEvent(unsignedEvent)
    }

    // Fall back to NIP-07 extension
    if (window.nostr) {
      return await window.nostr.signEvent(unsignedEvent)
    }

    throw new Error("No signer available")
  }

  const performLogin = async (pubkey: string) => {
    // Step 1: Get challenge from server
    const challengeRes = await fetch('/api/auth/nostr')
    if (!challengeRes.ok) throw new Error('Failed to get challenge')
    const { challenge } = await challengeRes.json()

    // Step 2: Sign challenge event (NIP-42 kind 22242)
    const signedEvent = await signChallenge(challenge, pubkey)

    // Step 3: Send signed event to server for verification
    const authRes = await fetch('/api/auth/nostr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedEvent }),
    })

    if (!authRes.ok) {
      const error = await authRes.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await authRes.json()
    setUser(data.user)
    router.push('/dashboard')
  }

  const loginWithNostr = async () => {
    if (!window.nostr) {
      throw new Error('No Nostr extension detected. Please install Alby or nos2x.')
    }

    const pubkey = await window.nostr.getPublicKey()
    await performLogin(pubkey)
  }

  const loginWithNip46 = async (signer: Nip46Signer) => {
    nip46SignerRef.current = signer
    const pubkey = await signer.getPublicKey()
    await performLogin(pubkey)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    
    // Clean up NIP-46 connection
    if (nip46SignerRef.current) {
      nip46SignerRef.current.close()
      nip46SignerRef.current = null
    }
    clearBunkerConnection()
    
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithNostr, loginWithNip46, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
