"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/habits/ui/button"
import { Zap, Link2, AlertCircle, Check, Loader2, Shield, ExternalLink } from "lucide-react"
import { hasNip07Extension, waitForNip07, nip07GetPublicKey, nip07SignEvent } from "@/lib/habits/nostr/nip07"
import { parseConnectionString, Nip46Client, type Nip46Status } from "@/lib/habits/nostr/nip46"
import { hexToNpub, shortenNpub } from "@/lib/habits/nostr/crypto"
import { Input } from "@/components/habits/ui/input"
import { QrCode } from "@/components/habits/qr-code"
import type { UnsignedEvent, Event } from "nostr-tools"
import { buildAuthEvent } from "@/lib/habits/nostr/auth-event"
import { useTranslations } from "@/components/i18n/locale-provider"

type MigrationCopy = ReturnType<typeof useTranslations>["habits"]["app"]["nostrMigrationCard"]

interface NostrMigrationCardProps {
  apiKey: string
  onMigrationComplete: (pubkey: string, npub: string) => void
}

type MigrationState = "idle" | "connecting" | "signing" | "submitting" | "success" | "error"
type Nip46LaunchMode = "bunker" | "nostrconnect"

function getConnectionStringError(uri: string, t: MigrationCopy): string | null {
  if (!uri) return null
  if (!uri.startsWith("bunker://") && !uri.startsWith("nostrconnect://")) {
    return t.uriSchemeError
  }

  try {
    parseConnectionString(uri)
    return null
  } catch (err: any) {
    return err?.message || t.invalidConnectionString
  }
}

/**
 * Request a challenge nonce from the server
 */
async function requestChallenge(pubkey: string, t: MigrationCopy): Promise<string> {
  const response = await fetch(`/api/auth/nostr/challenge?pubkey=${encodeURIComponent(pubkey)}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: t.challengeFailed }))
    throw new Error(error.error || t.challengeFailed)
  }
  
  const { challenge } = await response.json()
  if (!challenge) {
    throw new Error(t.noChallenge)
  }
  
  return challenge
}

/**
 * Create an unsigned auth event with the challenge
 */
function createAuthEvent(pubkey: string, challenge: string): UnsignedEvent {
  return { ...buildAuthEvent(challenge, "/api/auth/nostr/migrate"), pubkey }
}

export function NostrMigrationCard({ apiKey, onMigrationComplete }: NostrMigrationCardProps) {
  const t = useTranslations().habits.app.nostrMigrationCard
  const [hasExtension, setHasExtension] = useState(false)
  const [state, setState] = useState<MigrationState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [linkedNpub, setLinkedNpub] = useState<string | null>(null)
  
  // NIP-46 state
  const [showNip46Input, setShowNip46Input] = useState(false)
  const [nip46LaunchMode, setNip46LaunchMode] = useState<Nip46LaunchMode>("bunker")
  const [nip46Input, setNip46Input] = useState("")
  const [nip46Status, setNip46Status] = useState<Nip46Status>("disconnected")
  const trimmedNip46Input = nip46Input.trim()
  const nip46ValidationError = getConnectionStringError(trimmedNip46Input, t)
  const isNip46UriValid = !!trimmedNip46Input && !nip46ValidationError

  // Check for NIP-07 extension on mount
  useEffect(() => {
    waitForNip07(2000).then(setHasExtension)
  }, [])

  /**
   * Submit migration request to the server
   */
  const submitMigration = useCallback(async (pubkey: string, signedEvent: Event) => {
    setState("submitting")
    
    const response = await fetch("/api/auth/nostr/migrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ pubkey, signedEvent }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: t.migrationFailed }))
      throw new Error(data.error || t.migrationFailed)
    }

    return response.json()
  }, [apiKey, t])

  /**
   * Handle NIP-07 extension migration
   */
  const handleNip07Migration = useCallback(async () => {
    setError(null)
    setState("connecting")

    try {
      const available = await waitForNip07(3000)
      if (!available) {
        throw new Error(t.noExtensionFound)
      }

      // Get public key from extension
      const pubkey = await nip07GetPublicKey()
      
      // Request challenge from server
      const challenge = await requestChallenge(pubkey, t)
      
      // Create and sign auth event
      setState("signing")
      const unsignedEvent = createAuthEvent(pubkey, challenge)
      const signedEvent = await nip07SignEvent(unsignedEvent)
      
      // Submit migration
      await submitMigration(pubkey, signedEvent)
      
      // Success!
      const npub = hexToNpub(pubkey)
      setLinkedNpub(npub)
      setState("success")
      onMigrationComplete(pubkey, npub)
    } catch (err: any) {
      setError(err.message || t.migrationFailed)
      setState("error")
    }
  }, [submitMigration, onMigrationComplete, t])

  /**
   * Handle NIP-46 remote signer migration
   */
  const handleNip46Migration = useCallback(async () => {
    if (!trimmedNip46Input) {
      setError(t.enterConnectionString)
      return
    }

    const validationError = getConnectionStringError(trimmedNip46Input, t)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setState("connecting")

    let client: Nip46Client | null = null

    try {
      const params = parseConnectionString(trimmedNip46Input)
      client = new Nip46Client(params, setNip46Status)
      
      // Connect to remote signer and get pubkey
      const pubkey = await client.connect(30000)
      
      // Request challenge from server
      const challenge = await requestChallenge(pubkey, t)
      
      // Create and sign auth event
      setState("signing")
      const unsignedEvent = createAuthEvent(pubkey, challenge)
      const signedEvent = await client.signEvent(unsignedEvent)
      
      // Submit migration
      await submitMigration(pubkey, signedEvent)
      
      // Disconnect client (we don't need to maintain the connection)
      client.disconnect()
      
      // Success!
      const npub = hexToNpub(pubkey)
      setLinkedNpub(npub)
      setState("success")
      onMigrationComplete(pubkey, npub)
    } catch (err: any) {
      if (client) {
        client.disconnect()
      }
      setError(err.message || t.migrationFailed)
      setState("error")
    }
  }, [trimmedNip46Input, submitMigration, onMigrationComplete, t])

  const openSignerApp = useCallback(() => {
    if (!isNip46UriValid) return
    window.location.href = trimmedNip46Input
  }, [isNip46UriValid, trimmedNip46Input])

  /**
   * Reset to try again
   */
  const handleReset = useCallback(() => {
    setState("idle")
    setError(null)
    setShowNip46Input(false)
    setNip46LaunchMode("bunker")
    setNip46Input("")
    setNip46Status("disconnected")
  }, [])

  // Success state
  if (state === "success" && linkedNpub) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 space-y-4 border border-nutrition/30">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-nutrition/20 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-nutrition" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{t.linkedTitle}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {t.linkedDescription}
            </p>
            <code className="block mt-2 text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
              {shortenNpub(linkedNpub, 12)}
            </code>
          </div>
        </div>
      </div>
    )
  }

  // Processing states
  if (state === "connecting" || state === "signing" || state === "submitting") {
    const messages = {
      connecting: t.connecting,
      signing: t.signing,
      submitting: t.submitting,
    }

    return (
      <div className="bg-muted/30 rounded-lg p-4 space-y-4 border border-primary/30">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-foreground">{messages[state]}</span>
        </div>
        {state === "signing" && (
          <p className="text-sm text-muted-foreground">
            {t.approveSignature}
          </p>
        )}
      </div>
    )
  }

  // Idle / Error state - show options
  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-4 border border-primary/30">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{t.connectTitle}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {t.connectDescription}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showNip46Input ? (
        <div className="space-y-3">
          {/* NIP-07 Extension Button */}
          <Button
            onClick={handleNip07Migration}
            disabled={!hasExtension}
            className="w-full justify-start gap-3 h-auto py-3"
            variant={hasExtension ? "default" : "outline"}
          >
            <div className="h-8 w-8 rounded-lg bg-exercise/20 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-exercise" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">{t.connectWithExtension}</div>
              <div className="text-xs text-muted-foreground font-normal">
                {hasExtension 
                  ? t.extensionHint
                  : t.noExtensionDetected}
              </div>
            </div>
          </Button>

          {/* NIP-46 Remote Signer Button */}
          <Button
            onClick={() => setShowNip46Input(true)}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <div className="h-8 w-8 rounded-lg bg-work/20 flex items-center justify-center shrink-0">
              <Link2 className="h-4 w-4 text-work" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm">{t.connectWithRemoteSigner}</div>
              <div className="text-xs text-muted-foreground font-normal">
                {t.remoteSignerHint}
              </div>
            </div>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.connectionString}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={nip46LaunchMode === "bunker" ? "default" : "outline"}
                size="sm"
                onClick={() => setNip46LaunchMode("bunker")}
              >
                Bunker
              </Button>
              <Button
                type="button"
                variant={nip46LaunchMode === "nostrconnect" ? "default" : "outline"}
                size="sm"
                onClick={() => setNip46LaunchMode("nostrconnect")}
              >
                Nostr Connect
              </Button>
            </div>
            <Input
              type="text"
              placeholder={nip46LaunchMode === "bunker" ? "bunker://..." : "nostrconnect://..."}
              value={nip46Input}
              onChange={(e) => {
                setNip46Input(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === "Enter" && handleNip46Migration()}
              className="font-mono text-sm"
            />
            {nip46ValidationError && (
              <p className="text-xs text-destructive">{nip46ValidationError}</p>
            )}
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="rounded-md border border-border p-2">
                <div className="font-medium text-foreground">Bunker</div>
                <div className="mt-1 font-mono break-all">bunker://pubkey?relay=wss://...</div>
              </div>
              <div className="rounded-md border border-border p-2">
                <div className="font-medium text-foreground">Nostr Connect</div>
                <div className="mt-1 font-mono break-all">
                  nostrconnect://pubkey?relay=wss://...
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t.launchSignerApp}</p>
                <p className="text-xs text-muted-foreground">
                  {t.launchSignerAppHint}
                </p>
              </div>
              <Button
                type="button"
                onClick={openSignerApp}
                disabled={!isNip46UriValid}
                size="sm"
                className="shrink-0 gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t.openApp}
              </Button>
            </div>
            <div className="flex justify-center">
              {isNip46UriValid ? (
                <QrCode
                  value={trimmedNip46Input}
                  title={t.qrTitle}
                  className="h-40 w-40 rounded-md border border-border"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                  {t.qrPlaceholder}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleReset} variant="ghost" className="flex-1">
              {t.back}
            </Button>
            <Button 
              onClick={handleNip46Migration} 
              disabled={!isNip46UriValid}
              className="flex-1"
            >
              {t.connect}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
