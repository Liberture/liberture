"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/habits/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/habits/ui/card"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import type { CodexAccountStatus, DeviceAuthStatus } from "@/lib/habits/agent/sidecar"
import { cn } from "@/lib/utils"

/**
 * The site operator's page for the coach's codex login, after obelisk-agents'
 * Operator: start `codex login --device-auth` in the coach container, show the
 * link and one-time code, and let the admin finish it from any device.
 *
 * The admin secret stays in component state only — not in storage — so closing
 * the tab forgets it.
 */

const POLL_MS = 2_000

async function api<T>(secret: string, path: string, method: "GET" | "POST" | "DELETE" = "GET"): Promise<T> {
  const res = await fetch(`/api/agent/codex${path}`, {
    method,
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    cache: "no-store",
  })
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(body.error ?? `request failed (${res.status})`)
  return body as T
}

export function CoachAdmin({ apiKey = "", embedded = false }: { apiKey?: string; embedded?: boolean }) {
  const t = useTranslations().habits.app.coachAdmin
  const locale = useLocale()
  const dateLocale = locale === "es" ? "es-AR" : "en-US"
  /** False when the sidecar runs codex without an enforced sandbox. */
  const [sandboxOk, setSandboxOk] = useState(true)
  const [checking, setChecking] = useState(true)
  const [secretInput, setSecretInput] = useState("")
  const [secret, setSecret] = useState<string | null>(null)
  const [account, setAccount] = useState<CodexAccountStatus | null>(null)
  const [device, setDevice] = useState<DeviceAuthStatus | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  // The sandbox state comes from the user-facing status endpoint; only the
  // operator needs to hear about it, so it is shown here and not in the chat.
  useEffect(() => {
    let cancelled = false
    fetch("/api/agent/status", { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { sandboxOk?: boolean } | null) => {
        if (!cancelled && body) setSandboxOk(body.sandboxOk !== false)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [apiKey])

  const refresh = useCallback(async (key: string): Promise<void> => {
    const status = await api<CodexAccountStatus>(key, "")
    setAccount(status)
    setDevice(status.device.active || status.device.done ? status.device : null)
  }, [])

  useEffect(() => {
    let cancelled = false
    api<CodexAccountStatus>(apiKey, "").then((status) => {
      if (cancelled) return
      setAccount(status)
      setDevice(status.device.active || status.device.done ? status.device : null)
      setSecret(apiKey)
    }).catch((err: Error) => {
      if (!cancelled && embedded) setError(err.message)
    }).finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [apiKey, embedded])

  const unlock = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      await refresh(secretInput)
      setSecret(secretInput)
      setSecretInput("")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // Follow the device flow until it finishes, then re-read the account.
  useEffect(() => {
    if (secret === null || !device?.active) return
    const timer = setInterval(async () => {
      try {
        const next = await api<DeviceAuthStatus>(secret, "/device-auth")
        setDevice(next)
        if (!next.active) await refresh(secret)
      } catch (err) {
        setError((err as Error).message)
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [secret, device?.active, refresh])

  const act = async (fn: () => Promise<void>): Promise<void> => {
    setBusy(true)
    setError("")
    try {
      await fn()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const connect = (): Promise<void> =>
    act(async () => setDevice(await api<DeviceAuthStatus>(secret!, "/device-auth", "POST")))
  const cancel = (): Promise<void> =>
    act(async () => {
      await api(secret!, "/device-auth", "DELETE")
      setDevice(null)
    })
  const disconnect = (): Promise<void> =>
    act(async () => {
      if (!window.confirm(t.disconnectConfirm)) return
      await api(secret!, "/logout", "POST")
      await refresh(secret!)
    })

  const Wrapper = embedded ? "div" : "main"

  return (
    <Wrapper className={embedded ? "" : "min-h-screen bg-background px-4 py-10 sm:px-6"}>
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          {embedded ? null : <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>}
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </header>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/*
          Without a working sandbox the agent's file reads fail intermittently and
          it answers with something vague about an "environment error", which
          looks like a bug in the coach rather than a misconfigured host. The
          sidecar refuses to start in this state unless someone passed
          HABIT_AGENT_ALLOW_UNSANDBOXED=1, so seeing this means that override is on.
        */}
        {!sandboxOk ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{t.sandboxTitle}</span>{" "}
              {t.sandboxBody}{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">kernel.apparmor_restrict_unprivileged_userns=0</code>{" "}
              {t.sandboxRestart} <code className="rounded bg-muted px-1 py-0.5 text-foreground">habit-agent</code>.
            </span>
          </div>
        ) : null}

        {checking ? (
          <p className="text-sm text-muted-foreground">{t.checking}</p>
        ) : secret === null ? (
          <Card>
            <CardHeader>
              <CardTitle>{t.signInTitle}</CardTitle>
              <CardDescription>{t.signInDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={unlock} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="admin-secret">{t.adminSecret}</Label>
                  <Input
                    id="admin-secret"
                    type="password"
                    autoComplete="off"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy || !secretInput}>
                  {t.continue}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          account && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{t.chatGptConnection}</CardTitle>
                  <StatusChip account={account} />
                </div>
                {account.loggedIn && (
                  <CardDescription>
                    {account.email ?? t.signedIn}
                    {account.plan ? ` · ${account.plan}` : ""}
                    {account.lastRefresh
                      ? ` · ${formatMessage(t.tokenRefreshed, { time: new Date(account.lastRefresh).toLocaleString(dateLocale) })}`
                      : ""}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {account.authProblem && <p className="text-sm text-destructive">{t.authProblem}</p>}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={connect} disabled={busy || Boolean(device?.active)}>
                    {account.loggedIn ? t.reconnect : t.connect}
                  </Button>
                  {account.loggedIn && (
                    <Button variant="outline" onClick={disconnect} disabled={busy}>
                      {t.disconnect}
                    </Button>
                  )}
                </div>

                {device && <DevicePanel device={device} onCancel={cancel} />}
              </CardContent>
            </Card>
          )
        )}
      </div>
    </Wrapper>
  )
}

interface StatusChipProps {
  account: CodexAccountStatus
}

function StatusChip({ account }: StatusChipProps) {
  const t = useTranslations().habits.app.coachAdmin
  const [label, tone] = !account.loggedIn
    ? [t.statusNotConnected, "bg-destructive/15 text-destructive"]
    : account.authProblem
      ? [t.statusExpired, "bg-exercise/15 text-exercise"]
      : [account.mode === "apikey" ? t.statusApiKey : t.statusConnected, "bg-success/15 text-success"]
  return <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold", tone)}>{label}</span>
}

interface DevicePanelProps {
  device: DeviceAuthStatus
  onCancel: () => void
}

function DevicePanel({ device, onCancel }: DevicePanelProps) {
  const t = useTranslations().habits.app.coachAdmin
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  if (!device.active) {
    return device.ok ? (
      <p className="text-sm text-success">{t.deviceConnected}</p>
    ) : (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{t.deviceFailed}</p>
        {device.output && (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{device.output}</pre>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      {!device.url || !device.code ? (
        <p className="text-sm text-muted-foreground">{t.deviceStarting}</p>
      ) : (
        <>
          <p className="text-sm">
            {t.deviceStep1}
            <br />
            <a href={device.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary underline">
              {device.url}
            </a>
          </p>
          <p className="text-sm">{t.deviceStep2}</p>
          <p className="select-all text-center font-mono text-2xl font-bold tracking-widest">{device.code}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={async () => {
              try {
                await navigator.clipboard.writeText(device.code!)
                setCopied(true)
                setCopyError(false)
              } catch { setCopyError(true) }
            }}>{copied ? t.codeCopied : t.copyCode}</Button>
            <Button asChild><a href={device.url} target="_blank" rel="noopener noreferrer">{t.openSignIn}</a></Button>
          </div>
          {copyError && <p role="status" className="text-xs">{t.copyManually}</p>}
          <p className="text-xs text-muted-foreground">
            {device.expiresAt
              ? formatMessage(t.expiresAt, { time: new Date(device.expiresAt).toLocaleTimeString(locale === "es" ? "es-AR" : "en-US") })
              : t.expiresSoon}
          </p>
        </>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {t.cancel}
      </Button>
    </div>
  )
}
