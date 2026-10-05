"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { SignInDialog, type AuthResult, type AuthType } from "@/components/habits/sign-in-dialog"
import { useNostrAuth } from "@/lib/habits/nostr/auth-context"

// Storage keys shared with the tracker (kept from Liberture Habits so existing sessions restore).
const API_KEY_STORAGE = "habit-tracker-api-key"
const AUTH_TYPE_STORAGE = "habit-tracker-auth-type"
const NOSTR_PUBKEY_STORAGE = "habit-tracker-nostr-pubkey"
const NIP46_CONNECTION_STORAGE = "habit-tracker-nip46-connection"
const NOSTR_SESSION_STORAGE = "habit-tracker-nostr-session"
const POST_LOGIN_NEXT = "habit-tracker-post-login-next"

export interface HabitsAuthState {
  type: AuthType | null
  apiKey: string | null
  pubkey: string | null
  nip46Connection: string | null
}

const SIGNED_OUT: HabitsAuthState = { type: null, apiKey: null, pubkey: null, nip46Connection: null }

interface OpenSignInOptions {
  /** Where to go once signed in. Defaults to /tracker. Pass null to stay on the page. */
  next?: string | null
}

interface HabitsSessionValue {
  isChecking: boolean
  isSignedIn: boolean
  auth: HabitsAuthState
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
  localStorage.removeItem(NIP46_CONNECTION_STORAGE)
  localStorage.removeItem(NOSTR_SESSION_STORAGE)
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
  const nostrAuth = useNostrAuth()
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

  // Restore a legacy API key session on mount.
  useEffect(() => {
    const restore = async () => {
      if (localStorage.getItem(AUTH_TYPE_STORAGE) === "api-key") {
        const storedKey = localStorage.getItem(API_KEY_STORAGE)
        if (storedKey) {
          try {
            const response = await fetch("/api/auth/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ apiKey: storedKey }),
            })
            if (response.ok) setAuth({ ...SIGNED_OUT, type: "api-key", apiKey: storedKey })
            else clearAuthStorage()
          } catch {
            clearAuthStorage()
          }
        }
      }
      setIsChecking(false)
    }
    restore()
  }, [])

  // Follow the Nostr provider once it has restored (or not) the session.
  useEffect(() => {
    if (nostrAuth.isLoading) return
    setIsChecking(false)
    if (nostrAuth.isAuthenticated && nostrAuth.pubkey) {
      const type = nostrAuth.authMethod === "nip07" ? "nip07" : "nip46"
      localStorage.setItem(AUTH_TYPE_STORAGE, type)
      localStorage.setItem(NOSTR_PUBKEY_STORAGE, nostrAuth.pubkey)
      setAuth({ ...SIGNED_OUT, type, pubkey: nostrAuth.pubkey })
    }
  }, [nostrAuth.isAuthenticated, nostrAuth.isLoading, nostrAuth.pubkey, nostrAuth.authMethod])

  const handleAuthenticated = useCallback(
    (result: AuthResult) => {
      if (result.type === "api-key" && result.apiKey) {
        localStorage.setItem(AUTH_TYPE_STORAGE, "api-key")
        localStorage.setItem(API_KEY_STORAGE, result.apiKey)
        setAuth({ ...SIGNED_OUT, type: "api-key", apiKey: result.apiKey })
      } else if (result.pubkey && (result.type === "nip07" || result.type === "nip46" || result.type === "nsec")) {
        // The dialog already completed the challenge-response flow and stored the session.
        localStorage.setItem(AUTH_TYPE_STORAGE, result.type)
        localStorage.setItem(NOSTR_PUBKEY_STORAGE, result.pubkey)
        if (result.type === "nip46" && result.nip46Connection) {
          localStorage.setItem(NIP46_CONNECTION_STORAGE, result.nip46Connection)
        }
        setAuth({
          ...SIGNED_OUT,
          type: result.type,
          pubkey: result.pubkey,
          nip46Connection: result.nip46Connection ?? null,
        })
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
    // Best-effort server-side session revoke before clearing local state.
    const sessionToken = localStorage.getItem(NOSTR_SESSION_STORAGE)
    if (sessionToken) {
      try {
        await fetch(`/api/auth/nostr/session?token=${encodeURIComponent(sessionToken)}`, { method: "DELETE" })
      } catch {
        // Ignore — the local clear is what the user sees.
      }
    }
    clearAuthStorage()
    nostrAuth.logout()
    setAuth(SIGNED_OUT)
    router.push("/")
  }, [nostrAuth, router])

  const value = useMemo<HabitsSessionValue>(
    () => ({
      isChecking: isChecking || nostrAuth.isLoading,
      // The Nostr provider can report a restored session one render before
      // `auth` catches up; count it as signed in so pages don't flash sign-in.
      isSignedIn: auth.type !== null || (nostrAuth.isAuthenticated && !!nostrAuth.pubkey),
      auth,
      openSignIn,
      logout,
    }),
    [auth, isChecking, nostrAuth.isLoading, nostrAuth.isAuthenticated, nostrAuth.pubkey, openSignIn, logout]
  )

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
