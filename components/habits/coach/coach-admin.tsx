"use client"

import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/habits/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/habits/ui/card"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import type { CodexAccountStatus, DeviceAuthStatus } from "@/lib/habits/agent/sidecar"

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
  const [checking, setChecking] = useState(true)
  const [secretInput, setSecretInput] = useState("")
  const [secret, setSecret] = useState<string | null>(null)
  const [account, setAccount] = useState<CodexAccountStatus | null>(null)
  const [device, setDevice] = useState<DeviceAuthStatus | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

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
      if (!window.confirm("Sign the coach out? Nobody can use it until it is connected again.")) return
      await api(secret!, "/logout", "POST")
      await refresh(secret!)
    })

  return (
    <main className={embedded ? "bg-background px-4 py-6" : "min-h-screen bg-background px-4 py-10 sm:px-6"}>
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <h1 className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent">
            Coach connection
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect ChatGPT to start chatting with your habit coach.
          </p>
        </header>

        {error && (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {checking ? (
          <p className="text-sm text-muted-foreground">Checking connection…</p>
        ) : secret === null ? (
          <Card>
            <CardHeader>
              <CardTitle>Sign in to manage the coach</CardTitle>
              <CardDescription>Open Coach from your signed-in tracker account. Site operators can also use their admin secret here.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={unlock} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="admin-secret">Admin secret</Label>
                  <Input
                    id="admin-secret"
                    type="password"
                    autoComplete="off"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy || !secretInput}>
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          account && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>ChatGPT connection</CardTitle>
                  <StatusChip account={account} />
                </div>
                {account.loggedIn && (
                  <CardDescription>
                    {account.email ?? "signed in"}
                    {account.plan ? ` · ${account.plan}` : ""}
                    {account.lastRefresh ? ` · token refreshed ${new Date(account.lastRefresh).toLocaleString()}` : ""}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {account.authProblem && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Questions have been failing because this login stopped working. Reconnect it.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={connect} disabled={busy || Boolean(device?.active)}>
                    {account.loggedIn ? "Reconnect" : "Connect ChatGPT account"}
                  </Button>
                  {account.loggedIn && (
                    <Button variant="outline" onClick={disconnect} disabled={busy}>
                      Disconnect
                    </Button>
                  )}
                </div>

                {device && <DevicePanel device={device} onCancel={cancel} />}
              </CardContent>
            </Card>
          )
        )}
      </div>
    </main>
  )
}

interface StatusChipProps {
  account: CodexAccountStatus
}

function StatusChip({ account }: StatusChipProps) {
  const [label, tone] = !account.loggedIn
    ? ["not connected", "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"]
    : account.authProblem
      ? ["login expired", "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"]
      : [account.mode === "apikey" ? "API key" : "connected", "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"]
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>
}

interface DevicePanelProps {
  device: DeviceAuthStatus
  onCancel: () => void
}

function DevicePanel({ device, onCancel }: DevicePanelProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  if (!device.active) {
    return device.ok ? (
      <p className="text-sm text-emerald-700 dark:text-emerald-400">Connected. The coach is ready.</p>
    ) : (
      <div className="space-y-2">
        <p className="text-sm text-red-700 dark:text-red-300">The sign-in did not complete.</p>
        {device.output && (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{device.output}</pre>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
      {!device.url || !device.code ? (
        <p className="text-sm text-muted-foreground">Starting sign-in…</p>
      ) : (
        <>
          <p className="text-sm">
            1. Open this link on any device and sign in to ChatGPT:
            <br />
            <a href={device.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-purple-700 underline dark:text-purple-300">
              {device.url}
            </a>
          </p>
          <p className="text-sm">2. Enter this one-time code:</p>
          <p className="select-all text-center font-mono text-2xl font-bold tracking-widest">{device.code}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={async () => {
              try {
                await navigator.clipboard.writeText(device.code!)
                setCopied(true)
                setCopyError(false)
              } catch { setCopyError(true) }
            }}>{copied ? "Code copied" : "Copy code"}</Button>
            <Button asChild><a href={device.url} target="_blank" rel="noopener noreferrer">Open ChatGPT sign-in</a></Button>
          </div>
          {copyError && <p role="status" className="text-xs">Select the code above to copy it manually.</p>}
          <p className="text-xs text-muted-foreground">
            Only use a code you started here. It expires
            {device.expiresAt ? ` at ${new Date(device.expiresAt).toLocaleTimeString()}` : " in 15 minutes"}; this page
            updates by itself once you are done.
          </p>
        </>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
