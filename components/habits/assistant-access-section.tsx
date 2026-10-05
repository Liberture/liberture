"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Check, Copy, Download, ExternalLink, Key, RefreshCw, Trash2, Unplug } from "lucide-react"

import { Switch } from "@/components/habits/ui/switch"
import { API_SCOPES, DEFAULT_OFF, type ApiScope } from "@/lib/habits/api-scopes"
import { SettingRow, SettingsCard, settingsButtonClass } from "@/components/habits/settings/settings-ui"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

type AssistantAccessCopy = ReturnType<typeof useTranslations>["habits"]["app"]["assistantAccessSection"]

interface AssistantAccessSectionProps {
  apiKey: string
  isNostrAuth: boolean
}

interface Connection {
  id: string
  name: string
  kind: string
  createdAt: string
  lastUsedAt: string | null
}

function ago(iso: string | null, t: AssistantAccessCopy): string {
  if (!iso) return t.notUsedYet
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (minutes < 2) return t.usedJustNow
  if (minutes < 60) return formatMessage(t.usedMinutesAgo, { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 48) return formatMessage(t.usedHoursAgo, { count: hours })
  return formatMessage(t.usedDaysAgo, { count: Math.round(hours / 24) })
}

/**
 * Settings → Voice assistants. Connecting is one URL plus sign-in-and-approve
 * (OAuth, app/oauth): it lasts until disconnected here. Each connected app has
 * its own credential, so disconnecting one never touches the others.
 * Permissions are saved to /api/v1/auth/permissions, never via the blob save.
 */
export function AssistantAccessSection({ apiKey, isNostrAuth }: AssistantAccessSectionProps) {
  const t = useTranslations().habits.app.assistantAccessSection
  const SCOPE_COPY = t.scopes
  const [origin, setOrigin] = useState("")
  const [gptUrl, setGptUrl] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[] | null>(null)
  const [permissions, setPermissions] = useState<Record<ApiScope, boolean> | null>(null)
  const [savingScope, setSavingScope] = useState<ApiScope | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // Script token (hti_), for people driving the API from their own code.
  const [tokenStatus, setTokenStatus] = useState<"loading" | "has" | "none">("loading")
  const [tokenPrefix, setTokenPrefix] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)

  const mcpUrl = `${origin}/mcp`

  /** Owner auth: the ht_ key as Bearer, or the Nostr session as ?token=. */
  const ownerRequest = useCallback(
    (path: string, init: RequestInit = {}) => {
      const sessionToken = isNostrAuth ? localStorage.getItem("habit-tracker-nostr-session") : null
      const url = sessionToken ? `${path}?token=${encodeURIComponent(sessionToken)}` : path
      const headers = new Headers(init.headers)
      if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`)
      return fetch(url, { ...init, headers, credentials: "same-origin" })
    },
    [apiKey, isNostrAuth]
  )

  const loadConnections = useCallback(() => {
    ownerRequest("/api/v1/connections")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setConnections(d?.connections ?? []))
      .catch(() => setConnections([]))
  }, [ownerRequest])

  useEffect(() => {
    setOrigin(window.location.origin)
    fetch("/api/v1/integrations")
      .then((r) => r.json())
      .then((d) => setGptUrl(d.gptUrl ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!apiKey && !isNostrAuth) return
    loadConnections()
    ownerRequest("/api/v1/auth/permissions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.permissions && setPermissions(d.permissions))
      .catch(() => {})
    ownerRequest("/api/v1/auth/token")
      .then((r) => r.json())
      .then((d) => {
        setTokenStatus(d.hasToken ? "has" : "none")
        setTokenPrefix(d.prefix ?? null)
      })
      .catch(() => setTokenStatus("none"))
  }, [apiKey, isNostrAuth, ownerRequest, loadConnections])

  // A connection approved in another tab (Claude's sign-in window) should
  // show up when the user comes back here.
  useEffect(() => {
    const onFocus = () => loadConnections()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loadConnections])

  const copy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Clipboard blocked; the value is still on screen to select by hand.
    }
  }

  const downloadSkill = async () => {
    setDownloading(true)
    try {
      const res = await ownerRequest("/api/v1/connections/claude-skill", { method: "POST" })
      if (!res.ok) throw new Error(String(res.status))
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement("a")
      a.href = url
      a.download = "liberture-habits-skill.zip"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      loadConnections()
    } catch {
      alert(t.skillError)
    } finally {
      setDownloading(false)
    }
  }

  const disconnect = async (connection: Connection) => {
    if (!confirm(formatMessage(t.disconnectConfirm, { name: connection.name }))) return
    const res = await ownerRequest(`/api/v1/connections/${connection.id}`, { method: "DELETE" })
    if (res.ok) setConnections((list) => (list ?? []).filter((c) => c.id !== connection.id))
    else alert(t.disconnectError)
  }

  const toggleScope = async (scope: ApiScope, enabled: boolean) => {
    if (!permissions) return
    const previous = permissions
    setPermissions({ ...permissions, [scope]: enabled })
    setSavingScope(scope)
    try {
      const res = await ownerRequest("/api/v1/auth/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: { [scope]: enabled } }),
      })
      const data = await res.json()
      if (res.ok && data.permissions) setPermissions(data.permissions)
      else {
        setPermissions(previous)
        alert(data.error ?? t.savePermissionError)
      }
    } catch {
      setPermissions(previous)
      alert(t.savePermissionNetworkError)
    } finally {
      setSavingScope(null)
    }
  }

  const handleGenerateToken = async () => {
    if (tokenStatus === "has" && !confirm(t.regenerateTokenConfirm)) return
    setTokenLoading(true)
    try {
      const res = await ownerRequest("/api/v1/auth/token", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setNewToken(data.token)
        setTokenPrefix(`${data.token.slice(0, 12)}...`)
        setTokenStatus("has")
      } else alert(data.error ?? t.generateTokenError)
    } catch {
      alert(t.generateTokenNetworkError)
    } finally {
      setTokenLoading(false)
    }
  }

  const handleRevokeToken = async () => {
    if (!confirm(t.revokeTokenConfirm)) return
    setTokenLoading(true)
    try {
      const res = await ownerRequest("/api/v1/auth/token", { method: "DELETE" })
      if (res.ok) {
        setTokenStatus("none")
        setTokenPrefix(null)
        setNewToken(null)
      }
    } finally {
      setTokenLoading(false)
    }
  }

  const step = (n: number, children: React.ReactNode) => (
    <li className="flex gap-3 text-sm text-muted-foreground">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  )

  const urlBox = (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground">
        {mcpUrl}
      </code>
      <button type="button" onClick={() => copy("mcp", mcpUrl)} className={settingsButtonClass()}>
        {copiedField === "mcp" ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
        {copiedField === "mcp" ? t.copied : t.copy}
      </button>
    </div>
  )

  return (
    <>
      <SettingsCard
        title={t.connectTitle}
        description={
          <>
            {t.connectDescription}{" "}
            <Link href="/docs" target="_blank" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <BookOpen className="h-3.5 w-3.5" />
              {t.guide}
            </Link>
          </>
        }
      >
        <div className="space-y-3 rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-semibold text-foreground">Claude</p>
          <ol className="space-y-2">
            {step(1, <>{t.claudeStep1Before}<b className="text-foreground">{t.claudeStep1Path}</b>{t.claudeStep1After}</>)}
            {step(2, <>{t.claudeStep2Before}<b className="text-foreground">{t.claudeStep2Add}</b>{t.claudeStep2Middle}<b className="text-foreground">{t.claudeStep2Connect}</b>{t.claudeStep2After}</>)}
          </ol>
          {urlBox}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={downloadSkill} disabled={downloading} className={settingsButtonClass()}>
              {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t.downloadSkill}
            </button>
            <span className="text-xs text-muted-foreground">{t.downloadSkillHint}</span>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-semibold text-foreground">ChatGPT</p>
          {gptUrl ? (
            <>
              <a href={gptUrl} target="_blank" rel="noopener noreferrer" className={cn(settingsButtonClass("primary"), "w-full")}>
                <ExternalLink className="h-4 w-4" />
                {t.openInChatGpt}
              </a>
              <p className="text-xs text-muted-foreground">{t.chatGptHint}</p>
            </>
          ) : (
            <>
              <ol className="space-y-2">
                {step(1, <>{t.chatGptStep1Before}<b className="text-foreground">{t.chatGptStep1Path}</b>{t.chatGptStep1Middle}<b className="text-foreground">{t.chatGptStep1Create}</b>{t.chatGptStep1After}</>)}
                {step(2, <>{t.chatGptStep2Before}<b className="text-foreground">OAuth</b>{t.chatGptStep2After}</>)}
              </ol>
              {urlBox}
            </>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title={t.connectedTitle} description={t.connectedDescription}>
        {connections === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" /> {t.loading}
          </p>
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noConnections}</p>
        ) : (
          <ul className="space-y-2">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{ago(c.lastUsedAt, t)}</p>
                </div>
                <button type="button" onClick={() => disconnect(c)} className={settingsButtonClass("danger")}>
                  <Unplug className="h-3.5 w-3.5" />
                  {t.disconnect}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title={t.permissionsTitle} description={t.permissionsDescription}>
        {permissions ? (
          API_SCOPES.map((scope) => (
            <SettingRow
              key={scope}
              htmlFor={`scope-${scope}`}
              title={
                <span className="flex items-center gap-2">
                  {SCOPE_COPY[scope].label}
                  {DEFAULT_OFF.has(scope) ? (
                    <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                      {t.offByDefault}
                    </span>
                  ) : null}
                </span>
              }
              description={SCOPE_COPY[scope].hint}
              action={
                <Switch
                  id={`scope-${scope}`}
                  checked={permissions[scope]}
                  disabled={savingScope !== null}
                  onCheckedChange={(checked) => {
                    if (checked && DEFAULT_OFF.has(scope) && !confirm(formatMessage(t.enableDestructiveConfirm, { action: SCOPE_COPY[scope].label.toLowerCase() }))) return
                    toggleScope(scope, checked)
                  }}
                />
              }
            />
          ))
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" /> {t.loadingPermissions}
          </p>
        )}
      </SettingsCard>

      <SettingsCard title={t.scriptTokenTitle} description={t.scriptTokenDescription}>
        {tokenStatus === "has" && !newToken && (
          <SettingRow
            title={<span className="font-mono">{tokenPrefix}</span>}
            description={t.active}
            action={
              <div className="flex gap-2">
                <button type="button" onClick={handleGenerateToken} disabled={tokenLoading} className={settingsButtonClass()}>
                  <RefreshCw className="h-4 w-4" /> {t.regenerate}
                </button>
                <button type="button" onClick={handleRevokeToken} disabled={tokenLoading} className={settingsButtonClass("danger")}>
                  <Trash2 className="h-4 w-4" /> {t.revoke}
                </button>
              </div>
            }
          />
        )}
        {tokenStatus === "none" && (
          <SettingRow
            title={t.noToken}
            action={
              <button type="button" onClick={handleGenerateToken} disabled={tokenLoading} className={settingsButtonClass()}>
                <Key className="h-4 w-4" /> {t.generate}
              </button>
            }
          />
        )}
        {newToken && (
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-primary/30 bg-card px-3 py-2 font-mono text-xs text-primary">
              {newToken}
            </code>
            <button type="button" onClick={() => copy("token", newToken)} className={settingsButtonClass()}>
              {copiedField === "token" ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
              {copiedField === "token" ? t.copied : t.copy}
            </button>
          </div>
        )}
      </SettingsCard>
    </>
  )
}
