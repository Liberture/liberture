"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import {
  Loader2,
  Zap,
  Link2,
  AlertCircle,
  ExternalLink,
  Copy,
  X,
  KeyRound,
  UserPlus,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
} from "lucide-react"
import { Nip07Signer, PrivateKeySigner, isNip07Available } from "@nostr-wot/signers"
import {
  generateKeyPair,
  getPublicKeyFromPrivate,
  hexToNpub,
  isValidNsec,
  nsecToHex,
  type NostrKeyPair,
} from "@/lib/habits/nostr/crypto"
import { QrCode } from "@/components/habits/qr-code"
import { fromBunkerUri, startNostrConnect } from "@/lib/habits/nostr/bunker-signer-adapter"
import type { Event, UnsignedEvent } from "nostr-tools"
import { buildAuthEvent } from "@/lib/habits/nostr/auth-event"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

type SignInStrings = ReturnType<typeof useTranslations>["habits"]["app"]["signInDialog"]

// AuthType / AuthResult are kept compatible with the existing app/page.tsx
// restore logic. We emit Nostr results from this screen; "nsec" covers both
// signing in with a pasted secret key and creating a brand-new key.
export type AuthType = "api-key" | "nip07" | "nip46" | "nsec"

export interface AuthResult {
  type: AuthType
  apiKey?: string
  pubkey?: string
  npub?: string
  nip46Connection?: string
}

interface SignInDialogProps {
  open: boolean
  onClose: () => void
  onAuthenticated: (result: AuthResult) => void
}

interface ChallengeSigner {
  signEvent(event: Omit<UnsignedEvent, "pubkey"> | UnsignedEvent): Promise<Event>
}

const AUTH_IN_PROGRESS_KEY = "habit-tracker-auth-in-progress"
const NOSTRCONNECT_RELAYS = ["wss://relay.nsec.app", "wss://relay.damus.io", "wss://nos.lol"]

function getBunkerUrlError(uri: string, t: SignInStrings): string | null {
  if (!uri) return null
  if (!uri.startsWith("bunker://")) return t.errorBunkerPrefix
  return null
}

async function waitForNip07(timeoutMs: number): Promise<boolean> {
  if (isNip07Available()) return true
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100))
    if (isNip07Available()) return true
  }
  return false
}

async function performChallengeAuth(
  signer: ChallengeSigner,
  pubkey: string,
  t: SignInStrings
): Promise<{ sessionToken?: string }> {
  const challengeRes = await fetch(
    `/api/auth/nostr/challenge?pubkey=${encodeURIComponent(pubkey)}`
  )
  if (!challengeRes.ok) {
    const err = await challengeRes
      .json()
      .catch(() => ({ error: t.errorChallengeRequest }))
    throw new Error(err.error || t.errorChallengeRequest)
  }
  const { challenge } = await challengeRes.json()
  if (!challenge) throw new Error(t.errorNoChallenge)

  const signedEvent = await signer.signEvent(buildAuthEvent(challenge, "/api/auth/nostr"))

  const authRes = await fetch("/api/auth/nostr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkey, signedEvent }),
  })
  if (!authRes.ok) {
    const err = await authRes
      .json()
      .catch(() => ({ error: t.errorAuthFailed }))
    throw new Error(err.error || t.errorAuthFailed)
  }
  return authRes.json().catch(() => ({}))
}

function storeSessionToken(sessionToken?: string) {
  if (sessionToken) localStorage.setItem("habit-tracker-nostr-session", sessionToken)
}

function normalizeLoginError(err: unknown, fallback: string, t: SignInStrings): string {
  const msg = err instanceof Error ? err.message : fallback
  if (/timeout/i.test(msg)) return t.errorTimeout
  if (/denied|rejected/i.test(msg)) return t.errorDenied
  if (/cancelled/i.test(msg)) return t.errorCancelled
  return msg
}

export function SignInDialog({ open, onClose, onAuthenticated }: SignInDialogProps) {
  const t = useTranslations().habits.app.signInDialog
  const [hasExtension, setHasExtension] = useState(false)
  const [subMode, setSubMode] = useState<"select" | "nip46" | "nsec">("select")
  const [bunkerInput, setBunkerInput] = useState("")
  const [connectUri, setConnectUri] = useState("")
  const [waitingForScan, setWaitingForScan] = useState(false)
  const [authChallengeUrl, setAuthChallengeUrl] = useState<string | null>(null)
  const [showSlowHint, setShowSlowHint] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const handleRef = useRef<{ cancel: () => void } | null>(null)

  // nsec (secret key) login + brand-new key onboarding
  const [nsecMode, setNsecMode] = useState<"login" | "create">("login")
  const [nsecInput, setNsecInput] = useState("")
  const [showNsec, setShowNsec] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<NostrKeyPair | null>(null)
  const [confirmedBackup, setConfirmedBackup] = useState(false)

  const trimmedBunkerInput = bunkerInput.trim()

  useEffect(() => {
    waitForNip07(2000).then(setHasExtension)

    // Do not auto-resume the remote-signer modal from a persisted flag.
    // If a stale installed PWA crashes while login is in progress, this flag can
    // survive the client-side exception screen and force the user straight back
    // into the login modal on reload. Start fresh and let the user opt in again.
    localStorage.removeItem(AUTH_IN_PROGRESS_KEY)
  }, [])

  useEffect(() => {
    if (subMode !== "nip46") return
    if (connectUri) return

    let cancelled = false

    const generateAndWait = async () => {
      setIsLoading(true)
      setError("")
      setAuthChallengeUrl(null)
      localStorage.setItem(AUTH_IN_PROGRESS_KEY, "true")

      try {
        const handle = startNostrConnect({
          relays: NOSTRCONNECT_RELAYS,
          metadata: { name: "Liberture", url: "https://liberture-habits.fabriok.ar" },
          onAuthChallenge: (url) => setAuthChallengeUrl(url),
        })

        handleRef.current = { cancel: handle.cancel }
        setConnectUri(handle.uri)
        setWaitingForScan(true)
        setShowSlowHint(false)

        const slowTimer = window.setTimeout(() => setShowSlowHint(true), 10000)
        const signer = await handle.ready
        window.clearTimeout(slowTimer)

        if (cancelled) return

        const pubkey = await signer.getPublicKey()
        const { sessionToken } = await performChallengeAuth(signer, pubkey, t)
        storeSessionToken(sessionToken)
        localStorage.removeItem(AUTH_IN_PROGRESS_KEY)

        onAuthenticated({
          type: "nip46",
          pubkey,
          npub: hexToNpub(pubkey),
          nip46Connection: handle.uri,
        })
      } catch (err) {
        localStorage.removeItem(AUTH_IN_PROGRESS_KEY)
        if (!cancelled) {
          setError(normalizeLoginError(err, t.errorConnectionFailed, t))
          setWaitingForScan(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setShowSlowHint(false)
        }
      }
    }

    generateAndWait()

    return () => {
      cancelled = true
      handleRef.current?.cancel()
      handleRef.current = null
    }
  }, [subMode]) // Obelisk-style one-shot QR generation; connectUri intentionally excluded.

  const handleNip07Login = async () => {
    setIsLoading(true)
    setError("")
    try {
      const available = await waitForNip07(3000)
      if (!available) {
        throw new Error(t.errorNoExtension)
      }
      const signer = new Nip07Signer()
      const pubkey = await signer.getPublicKey()
      const { sessionToken } = await performChallengeAuth(signer, pubkey, t)
      storeSessionToken(sessionToken)
      onAuthenticated({ type: "nip07", pubkey, npub: hexToNpub(pubkey) })
    } catch (err) {
      setError(normalizeLoginError(err, t.errorExtensionFailed, t))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBunkerUrlLogin = async (manualUri?: string) => {
    const uri = (manualUri ?? trimmedBunkerInput).trim()
    const validationError = getBunkerUrlError(uri, t)
    if (!uri || validationError) {
      setError(validationError || t.errorPasteBunker)
      return
    }

    setIsLoading(true)
    setError("")
    setAuthChallengeUrl(null)
    try {
      const signer = await fromBunkerUri(uri, {
        onAuthChallenge: (url) => setAuthChallengeUrl(url),
      })
      const pubkey = await signer.getPublicKey()
      const { sessionToken } = await performChallengeAuth(signer, pubkey, t)
      storeSessionToken(sessionToken)
      await signer.close()
      onAuthenticated({
        type: "nip46",
        pubkey,
        npub: hexToNpub(pubkey),
        nip46Connection: uri,
      })
    } catch (err) {
      setError(normalizeLoginError(err, t.errorRemoteSignerFailed, t))
    } finally {
      setIsLoading(false)
    }
  }

  // Generate a fresh key as soon as the user opts into account creation.
  // Kept in component state only — never persisted — and discarded the moment
  // the modal closes or the screen unmounts.
  useEffect(() => {
    if (subMode !== "nsec" || nsecMode !== "create") return
    if (generatedKey) return
    setGeneratedKey(generateKeyPair())
  }, [subMode, nsecMode, generatedKey])

  const signInWithSecretKey = async (secretKey: Uint8Array | string, publicKeyHex: string) => {
    const signer = new PrivateKeySigner(secretKey)
    const { sessionToken } = await performChallengeAuth(signer, publicKeyHex, t)
    storeSessionToken(sessionToken)
    onAuthenticated({ type: "nsec", pubkey: publicKeyHex, npub: hexToNpub(publicKeyHex) })
  }

  const handleNsecInputLogin = async () => {
    const nsec = nsecInput.trim()
    if (!nsec) {
      setError(t.errorNsecEmpty)
      return
    }
    if (!isValidNsec(nsec)) {
      setError(t.errorNsecInvalid)
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const hex = nsecToHex(nsec)
      const pubkey = getPublicKeyFromPrivate(hex)
      await signInWithSecretKey(hex, pubkey)
    } catch (err) {
      setError(normalizeLoginError(err, t.errorNsecFailed, t))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasteNsec = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setNsecInput(text.trim())
    } catch {
      setError(t.errorClipboard)
    }
  }

  const handleCopyNsec = async () => {
    if (!generatedKey) return
    try {
      await navigator.clipboard.writeText(generatedKey.nsec)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = generatedKey.nsec
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateAccount = async () => {
    if (!generatedKey) return
    if (!confirmedBackup) {
      setError(t.errorConfirmBackup)
      return
    }
    setIsLoading(true)
    setError("")
    try {
      await signInWithSecretKey(generatedKey.privateKey, generatedKey.publicKey)
    } catch (err) {
      setError(normalizeLoginError(err, t.errorCreateFailed, t))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    localStorage.removeItem(AUTH_IN_PROGRESS_KEY)
    handleRef.current?.cancel()
    handleRef.current = null
    setSubMode("select")
    setBunkerInput("")
    setConnectUri("")
    setWaitingForScan(false)
    setAuthChallengeUrl(null)
    setShowSlowHint(false)
    setNsecMode("login")
    setNsecInput("")
    setShowNsec(false)
    setGeneratedKey(null)
    setConfirmedBackup(false)
    setError("")
    setIsLoading(false)
  }

  const handleCopyUri = useCallback(async () => {
    if (!connectUri) return
    try {
      await navigator.clipboard.writeText(connectUri)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = connectUri
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [connectUri])

  const closeLogin = useCallback(() => {
    onClose()
    // Drop back to the method picker so reopening doesn't resume a half-finished
    // remote-signer flow.
    handleBack()
  }, [onClose])

  // Escape closes, and the page behind shouldn't scroll while the modal is open.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  const openSignerApp = () => {
    if (!connectUri) return
    window.location.href = connectUri
  }

  if (!open) return null

  return (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm duration-200 animate-in fade-in sm:items-center sm:p-6"
          onClick={closeLogin}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.dialogAriaLabel}
            onClick={(event) => event.stopPropagation()}
            className="custom-scrollbar relative max-h-[92dvh] w-full max-w-md space-y-6 overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in slide-in-from-bottom-6 sm:rounded-2xl sm:zoom-in-95 sm:slide-in-from-bottom-0"
          >
            <button
              type="button"
              onClick={closeLogin}
              aria-label={t.closeAriaLabel}
              className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground text-sm">
              {subMode === "select"
                ? t.subtitleSelect
                : subMode === "nsec"
                  ? t.subtitleNsec
                  : t.subtitleNip46}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            {subMode === "select" ? (
              <>
                {hasExtension && (
                  <Button
                    onClick={handleNip07Login}
                    disabled={isLoading}
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary-foreground/15 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="text-left text-primary-foreground">
                      <div className="font-semibold">{t.extensionTitle}</div>
                      <div className="text-xs text-primary-foreground/80 font-normal">
                        {t.extensionHint}
                      </div>
                    </div>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setSubMode("nip46")
                    setError("")
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-work/20 flex items-center justify-center shrink-0">
                    <Link2 className="h-5 w-5 text-work" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{t.remoteSignerTitle}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      Amber, nsec.app, nsecBunker (NIP-46)
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    setSubMode("nsec")
                    setNsecMode("login")
                    setError("")
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-sleep/20 flex items-center justify-center shrink-0">
                    <KeyRound className="h-5 w-5 text-sleep" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{t.secretKeyTitle}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {t.secretKeyHint}
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    setSubMode("nsec")
                    setNsecMode("create")
                    setError("")
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-nutrition/20 flex items-center justify-center shrink-0">
                    <UserPlus className="h-5 w-5 text-nutrition" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{t.createTitle}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {t.createHint}
                    </div>
                  </div>
                </Button>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </>
            ) : subMode === "nsec" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNsecMode("login")
                      setGeneratedKey(null)
                      setConfirmedBackup(false)
                      setError("")
                    }}
                    className={
                      nsecMode === "login"
                        ? "rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                        : "rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    }
                  >
                    {t.tabHaveKey}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNsecMode("create")
                      setConfirmedBackup(false)
                      setError("")
                    }}
                    className={
                      nsecMode === "create"
                        ? "rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                        : "rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    }
                  >
                    {t.tabNew}
                  </button>
                </div>

                {nsecMode === "login" ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label htmlFor="nsec-input" className="text-sm font-medium text-foreground">
                        {t.nsecLabel}
                      </label>
                      <div className="relative">
                        <Input
                          id="nsec-input"
                          type={showNsec ? "text" : "password"}
                          inputMode="text"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          placeholder="nsec1..."
                          value={nsecInput}
                          onChange={(e) => setNsecInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isLoading) void handleNsecInputLogin()
                          }}
                          className="pr-12 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNsec((v) => !v)}
                          aria-label={showNsec ? t.hideKey : t.showKey}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                        >
                          {showNsec ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePasteNsec}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" /> {t.pasteFromClipboard}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      {t.nsecPrivacyNote}
                    </p>

                    <Button onClick={handleNsecInputLogin} disabled={isLoading} className="w-full gap-2">
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t.signInWithKey}
                    </Button>

                    {error && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <p className="text-foreground">
                          {t.backupWarningBefore}<span className="font-bold">nsec</span>{t.backupWarningMiddle}{" "}
                          <span className="font-bold">{t.backupWarningBold}</span>{t.backupWarningAfter}
                        </p>
                      </div>
                    </div>

                    {generatedKey && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t.newKeyLabel}
                        </label>
                        <div className="relative">
                          <textarea
                            readOnly
                            value={generatedKey.nsec}
                            rows={3}
                            onFocus={(e) => e.currentTarget.select()}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 pr-16 font-mono text-xs break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCopyNsec}
                            className="absolute right-2 top-2 gap-1.5"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            {copied ? t.copiedKey : t.copyKey}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground break-all">
                          {formatMessage(t.publicKey, { npub: generatedKey.npub })}
                        </p>
                      </div>
                    )}

                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmedBackup}
                        onChange={(e) => {
                          setConfirmedBackup(e.target.checked)
                          setError("")
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm text-muted-foreground">
                        {t.backupConfirm}
                      </span>
                    </label>

                    <Button
                      onClick={handleCreateAccount}
                      disabled={isLoading || !generatedKey || !confirmedBackup}
                      className="w-full gap-2"
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {t.createAccount}
                    </Button>

                    {error && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button onClick={handleBack} variant="ghost" className="w-full">
                  {t.back}
                </Button>
              </div>
            ) : (
              <>
                {authChallengeUrl && (
                  <a
                    href={authChallengeUrl}
                    target={authChallengeUrl.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={() => setAuthChallengeUrl(null)}
                    className="block rounded-lg border border-primary/50 bg-primary/10 p-3 text-center text-sm font-bold text-primary animate-pulse"
                  >
                    {t.actionRequired}
                  </a>
                )}

                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-3 space-y-3">
                    <div className="space-y-2 text-center">
                      <p className="text-sm font-medium text-foreground">Nostr Connect</p>
                      <p className="text-xs text-muted-foreground">
                        {t.connectHint}
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={openSignerApp}
                      disabled={!connectUri}
                      size="lg"
                      className="w-full gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t.openSignerApp}
                    </Button>

                    <div className="flex justify-center">
                      {connectUri ? (
                        <QrCode
                          value={connectUri}
                          title={t.qrTitle}
                          className="h-44 w-44 rounded-md border border-border"
                        />
                      ) : (
                        <div className="flex h-44 w-44 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                          {t.generatingConnection}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {connectUri && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyUri}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? t.copiedUri : t.copyUri}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const uri = window.prompt(t.promptBunker)?.trim() || ""
                          if (!uri) return
                          setBunkerInput(uri)
                          void handleBunkerUrlLogin(uri)
                        }}
                        disabled={isLoading}
                      >
                        {t.manualBunker}
                      </Button>
                    </div>
                  </div>

                  {waitingForScan && (
                    <div className="flex flex-col items-center gap-2 text-sm text-primary">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.waitingForConnection}
                      </div>
                      {showSlowHint && (
                        <p className="text-center text-xs text-muted-foreground">
                          {t.slowHint}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleBack}
                  disabled={false}
                  variant="ghost"
                  className="w-full"
                >
                  {t.back}
                </Button>
              </>
            )}
          </div>

            <p className="text-center text-xs text-muted-foreground">
              {t.footer}
            </p>
          </div>
        </div>
  )
}
