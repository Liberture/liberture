"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import "@/types/nostr"

interface User {
  id: string
  email: string
  name: string
  bosLevel: number
  nostrPubkey?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithNostr: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
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

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    setUser(data.user)
    router.push('/dashboard')
  }

  const loginWithNostr = async () => {
    if (!window.nostr) {
      throw new Error('No Nostr extension detected. Please install Alby or nos2x.')
    }

    // Step 1: Get challenge from server
    const challengeRes = await fetch('/api/auth/nostr')
    if (!challengeRes.ok) throw new Error('Failed to get challenge')
    const { challenge } = await challengeRes.json()

    // Step 2: Get public key from extension
    const pubkey = await window.nostr.getPublicKey()

    // Step 3: Sign challenge event (NIP-42 kind 22242)
    const unsignedEvent = {
      kind: 22242,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: challenge,
    }

    const signedEvent = await window.nostr.signEvent(unsignedEvent)

    // Step 4: Send signed event to server for verification
    const authRes = await fetch('/api/auth/nostr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedEvent }),
    })

    if (!authRes.ok) {
      const error = await authRes.json()
      throw new Error(error.error || 'Nostr login failed')
    }

    const data = await authRes.json()
    setUser(data.user)
    router.push('/dashboard')
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data = await response.json()
    setUser(data.user)
    router.push('/dashboard')
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithNostr, register, logout }}>
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
