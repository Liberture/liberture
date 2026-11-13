"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { SignInDialog, type AuthResult, type AuthType } from "@/components/habits/sign-in-dialog"
import { useNostrProfile, type NostrProfile } from "@/lib/habits/nostr/use-nostr-profile"

// Storage keys shared with the tracker (kept from Liberture Habits so existing sessions restore).
// The Nostr session itself is an httpOnly cookie; these only say how the user signed in.
const API_KEY_STORAGE = "habit-tracker-api-key"
const AUTH_TYPE_STORAGE = "habit-tracker-auth-type"
const NOSTR_PUBKEY_STORAGE = "habit-tracker-nostr-pubkey"
const POST_LOGIN_NEXT = "habit-tracker-post-login-next"

export interface HabitsAuthState {
  type: AuthType | null
  apiKey: string | null
  pubkey: string | null
}

const SIGNED_OUT: HabitsAuthState = { type: null, apiKey: null, pubkey: null }

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

async function restoreSession(signal: AbortSignal): Promise<HabitsAuthState> {
  const type = localStorage.getItem(AUTH_TYPE_STORAGE)
  const hadSession = !!localStorage.getItem('habit-tracker-nostr-session')
  for (const key of LEGACY_KEYS) localStorage.removeItem(key)
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (key && LEGACY_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) localStorage.removeItem(key)
  }

  const apiKey = type === "api-key" && localStorage.getItem(API_KEY_STORAGE)
  if (apiKey) {
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      signal,
    })
    if (response.ok) return { ...SIGNED_OUT, type: "api-key", apiKey }
    if (!signal.aborted && [400, 401, 403].includes(response.status)) clearAuthStorage()
  } else if (type === "nip07" || type === "nip46" || type === "nsec" || hadSession || localStorage.getItem(NOSTR_PUBKEY_STORAGE)) {
    const response = await fetch("/api/auth/nostr/session", { credentials: "same-origin", signal })
    if (response.ok) {
      const session = await response.json()
      if (!signal.aborted && session.valid && session.pubkey) {
        const method = type === "nip46" || type === "nsec" ? type : "nip07"
        localStorage.setItem(AUTH_TYPE_STORAGE, method)
        localStorage.setItem(NOSTR_PUBKEY_STORAGE, session.pubkey)
        return { ...SIGNED_OUT, type: method, pubkey: session.pubkey }
      }
    }
  }
  return SIGNED_OUT
}

interface OpenSignInOptions {
  /** Where to go once signed in. Defaults to /tracker. Pass null to stay on the page. */
  next?: string | null
}

interface HabitsSessionValue {
  isChecking: boolean
  isSignedIn: boolean
  auth: HabitsAuthState
  profile: NostrProfile | null
  authHeaders: Record<string, string>
  ownerRequest: (path: string, init?: RequestInit) => Promise<Response>
  openSignIn: (options?: OpenSignInOptions) => void
  logout: () => Promise<void>
}

const HabitsSessionContext = createContext<HabitsSessionValue | null>(null)

export function useHabitsSession(): HabitsSessionValue {
  const value = useContext(HabitsSessionContext)
  if (!value) throw new Error("useHabitsSession must be used within HabitsSessionProvider")
  return value
}

function clearAuthStorage() {
  localStorage.removeItem(API_KEY_STORAGE)
  localStorage.removeItem(AUTH_TYPE_STORAGE)
  localStorage.removeItem(NOSTR_PUBKEY_STORAGE)
}

/** Only same-site paths are followed after sign-in. */
function safeNext(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null
}

/**
 * Site-wide sign-in state (Nostr session, or a legacy API key) plus the sign-in
 * dialog. Any page can open it; `?signin=1&next=/path` opens it on load.
 */
export function HabitsSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const restoration = useRef<AbortController | null>(null)
  const [auth, setAuth] = useState<HabitsAuthState>(SIGNED_OUT)
  const [isChecking, setIsChecking] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingNext, setPendingNext] = useState<string | null>(null)

  const openSignIn = useCallback((options?: OpenSignInOptions) => {
    const next = options && "next" in options ? safeNext(options.next ?? null) : "/tracker"
    setPendingNext(next)
    setDialogOpen(true)
  }, [])

  // Links like /docs → "/?signin=1&next=/oauth/authorize?…" open the dialog on arrival.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("signin") !== "1") return
    const next = safeNext(url.searchParams.get("next"))
    url.searchParams.delete("signin")
    url.searchParams.delete("next")
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
    if (next) sessionStorage.setItem(POST_LOGIN_NEXT, next)
    openSignIn({ next: next ?? "/tracker" })
  }, [openSignIn])

  useEffect(() => {
    const controller = new AbortController()
    restoration.current = controller
    const timeout = setTimeout(() => controller.abort(), 10000)
    restoreSession(controller.signal).then(restored => {
      if (!controller.signal.aborted) setAuth(restored)
    }).catch(() => {}).finally(() => {
      clearTimeout(timeout)
      if (restoration.current === controller) setIsChecking(false)
    })
    return () => {
      restoration.current = null
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  const handleAuthenticated = useCallback(
    (result: AuthResult) => {
      restoration.current?.abort()
      setIsChecking(false)
      if (result.type === "api-key" && result.apiKey) {
        localStorage.setItem(AUTH_TYPE_STORAGE, "api-key")
        localStorage.setItem(API_KEY_STORAGE, result.apiKey)
        setAuth({ ...SIGNED_OUT, type: "api-key", apiKey: result.apiKey })
      } else if (result.pubkey && (result.type === "nip07" || result.type === "nip46" || result.type === "nsec")) {
        // The dialog already completed the challenge-response flow; the server set the session cookie.
        localStorage.setItem(AUTH_TYPE_STORAGE, result.type)
        localStorage.setItem(NOSTR_PUBKEY_STORAGE, result.pubkey)
        setAuth({ ...SIGNED_OUT, type: result.type, pubkey: result.pubkey })
      } else {
        return
      }

      setDialogOpen(false)
      const stored = safeNext(sessionStorage.getItem(POST_LOGIN_NEXT))
      sessionStorage.removeItem(POST_LOGIN_NEXT)
      const next = stored ?? pendingNext
      // OAuth consent needs a full load so the server sees the new session cookie.
      if (next?.startsWith("/oauth/")) window.location.assign(next)
      else if (next) router.push(next)
      else router.refresh()
    },
    [pendingNext, router]
  )

  const closeDialog = useCallback(() => setDialogOpen(false), [])

  const logout = useCallback(async () => {
    // Revokes the server-side session (cookie) before clearing local state.
    restoration.current?.abort()
    await fetch("/api/auth/nostr/session", { method: "DELETE", credentials: "same-origin" }).catch(() => {})
    clearAuthStorage()
    setAuth(SIGNED_OUT)
    router.push("/")
  }, [router])

  const profile = useNostrProfile(auth.pubkey)
  const authHeaders = useMemo((): Record<string, string> => auth.apiKey ? { Authorization: `Bearer ${auth.apiKey}` } : {}, [auth.apiKey])
  const ownerRequest = useCallback((path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    if (authHeaders.Authorization) headers.set("Authorization", authHeaders.Authorization)
    return fetch(path, { ...init, headers, mode: "same-origin", credentials: "same-origin" })
  }, [authHeaders])

  useEffect(() => {
    const identity = auth.pubkey
    if (!identity || isChecking) return
    const controller = new AbortController()
    async function register() {
      if (!identity) return
      const { challengePublicKey } = await import("@/lib/challenges/cashu")
      await navigator.locks.request("moderator-setup:" + identity, async () => {
        if (controller.signal.aborted) return
        const owner = "moderator-" + identity
        const pubkey = challengePublicKey(owner)
        localStorage.setItem("challenge-wallet-for:" + pubkey, owner)
        const marker = "challenge-moderator-registered:" + identity
        if (localStorage.getItem(marker) === pubkey) return
        const response = await ownerRequest("/api/challenges/moderator", {
          method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity, pubkey, name: (profile?.name || identity.slice(0,12)).slice(0,48) }),
        })
        if (response.ok) localStorage.setItem(marker, pubkey)
      })
    }
    const setup = () => { void register().catch(() => {}) }
    setup()
    window.addEventListener("online", setup)
    return () => { controller.abort(); window.removeEventListener("online", setup) }
  }, [auth.pubkey, isChecking, ownerRequest, profile?.name])

  const value = useMemo<HabitsSessionValue>(() => ({
    isChecking, isSignedIn: auth.type !== null, auth, profile, authHeaders, ownerRequest, openSignIn, logout,
  }), [isChecking, auth, profile, authHeaders, ownerRequest, openSignIn, logout])

  return (
    <HabitsSessionContext.Provider value={value}>
      {children}
      {/* Mounted only while open: every opening starts blank. Kept mounted, the
          dialog held on to a freshly generated key (nsec) after sign-in and
          showed it again to whoever chose "create an account" next. */}
      {dialogOpen && <SignInDialog open onClose={closeDialog} onAuthenticated={handleAuthenticated} />}
    </HabitsSessionContext.Provider>
  )
}
