"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Check, Copy, Download, ExternalLink, FileCode2, Key, RefreshCw, Trash2, Unplug } from "lucide-react"

import { Switch } from "@/components/habits/ui/switch"
import { notify } from "@/components/habits/ui/toast"
import { API_SCOPES, DEFAULT_OFF, type ApiScope } from "@/lib/habits/api-scopes"
import { SettingRow, SettingsCard, SettingsDivider, settingsButtonClass } from "@/components/habits/settings/settings-ui"
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

/** Owner auth: the ht_ key as Bearer, or the Nostr session as ?token=. */
function useOwnerRequest(apiKey: string, isNostrAuth: boolean) {
  return useCallback(
    (path: string, init: RequestInit = {}) => {
      let sessionToken: string | null = null
      try {
        sessionToken = isNostrAuth ? localStorage.getItem("habit-tracker-nostr-session") : null
      } catch {}
      const url = sessionToken ? `${path}?token=${encodeURIComponent(sessionToken)}` : path
      const headers = new Headers(init.headers)
      if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`)
      return fetch(url, { ...init, headers, credentials: "same-origin" })
    },
    [apiKey, isNostrAuth]
  )
}

function useCopy() {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const copy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // Clipboard blocked; the value is still on screen to select by hand.
    }
  }
  return { copiedField, copy }
}

function useMcpUrl() {
  const [origin, setOrigin] = useState("")
  useEffect(() => setOrigin(window.location.origin), [])
  return `${origin}/mcp`
}

function CopyBox({ value, field, copiedField, onCopy, tone = "default" }: {
  value: string
  field: string
  copiedField: string | null
  onCopy: (field: string, value: string) => void
  tone?: "default" | "primary"
}) {
  const t = useTranslations().habits.app.assistantAccessSection
  return (
    <div className="flex items-center gap-2">
      <code
        className={cn(
          "min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border bg-card px-3 py-2 font-mono text-xs",
          tone === "primary" ? "border-primary/30 text-primary" : "border-border text-foreground"
        )}
      >
        {value}
      </code>
      <button type="button" onClick={() => onCopy(field, value)} className={settingsButtonClass()}>
        {copiedField === field ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
        {copiedField === field ? t.copied : t.copy}
      </button>
    </div>
  )
}

/**
 * Settings → Assistants. Connecting is one URL plus sign-in-and-approve
 * (OAuth, app/oauth): it lasts until disconnected here. Each connected app has
 * its own credential, so disconnecting one never touches the others.
 * Permissions are saved to /api/v1/auth/permissions, never via the blob save.
 */
export function AssistantConnectSection({ apiKey, isNostrAuth }: AssistantAccessSectionProps) {
  const t = useTranslations().habits.app.assistantAccessSection
  const SCOPE_COPY = t.scopes
  const ownerRequest = useOwnerRequest(apiKey, isNostrAuth)
  const { copiedField, copy } = useCopy()
  const mcpUrl = useMcpUrl()
  const [gptUrl, setGptUrl] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[] | null>(null)
  const [permissions, setPermissions] = useState<Record<ApiScope, boolean> | null>(null)
  const [savingScope, setSavingScope] = useState<ApiScope | null>(null)

  const loadConnections = useCallback(() => {
    ownerRequest("/api/v1/connections")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setConnections(d?.connections ?? []))
      .catch(() => setConnections([]))
  }, [ownerRequest])

  useEffect(() => {
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
  }, [apiKey, isNostrAuth, ownerRequest, loadConnections])

  // A connection approved in another tab (Claude's sign-in window) should
  // show up when the user comes back here.
  useEffect(() => {
    const onFocus = () => loadConnections()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loadConnections])

  const disconnect = async (connection: Connection) => {
    if (!confirm(formatMessage(t.disconnectConfirm, { name: connection.name }))) return
    try {
      const res = await ownerRequest(`/api/v1/connections/${connection.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(String(res.status))
      setConnections((list) => (list ?? []).filter((c) => c.id !== connection.id))
      notify.success(formatMessage(t.disconnected, { name: connection.name }))
    } catch {
      notify.error(t.disconnectError)
    }
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
        notify.error(data.error ?? t.savePermissionError)
      }
    } catch {
      setPermissions(previous)
      notify.error(t.savePermissionNetworkError)
    } finally {
      setSavingScope(null)
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

  const urlBox = <CopyBox value={mcpUrl} field="mcp" copiedField={copiedField} onCopy={copy} />

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
                <button
                  type="button"
                  onClick={() => disconnect(c)}
                  aria-label={formatMessage(t.disconnectLabel, { name: c.name })}
                  className={settingsButtonClass("danger")}
                >
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
    </>
  )
}

/**
 * Settings → Developer / API: the raw MCP URL, the script token, the legacy
 * API key, the Claude skill and the API reference. Nothing here is needed to
 * connect an assistant; it is for people driving the API from their own code.
 */
export function DeveloperSection({ apiKey, isNostrAuth }: AssistantAccessSectionProps) {
  const t = useTranslations().habits.app.assistantAccessSection
  const ownerRequest = useOwnerRequest(apiKey, isNostrAuth)
  const { copiedField, copy } = useCopy()
  const mcpUrl = useMcpUrl()
  const [downloading, setDownloading] = useState(false)

  // Script token (hti_), for people driving the API from their own code.
  const [tokenStatus, setTokenStatus] = useState<"loading" | "has" | "none">("loading")
  const [tokenPrefix, setTokenPrefix] = useState<string | null>(null)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)

  useEffect(() => {
    if (!apiKey && !isNostrAuth) return
    ownerRequest("/api/v1/auth/token")
      .then((r) => r.json())
      .then((d) => {
        setTokenStatus(d.hasToken ? "has" : "none")
        setTokenPrefix(d.prefix ?? null)
      })
      .catch(() => setTokenStatus("none"))
  }, [apiKey, isNostrAuth, ownerRequest])

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
    } catch {
      notify.error(t.skillError)
    } finally {
      setDownloading(false)
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
      } else notify.error(data.error ?? t.generateTokenError)
    } catch {
      notify.error(t.generateTokenNetworkError)
    } finally {
      setTokenLoading(false)
    }
  }

  const handleRevokeToken = async () => {
    if (!confirm(t.revokeTokenConfirm)) return
    setTokenLoading(true)
    try {
      const res = await ownerRequest("/api/v1/auth/token", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        notify.error((data as { error?: string }).error ?? t.revokeTokenError)
        return
      }
      setTokenStatus("none")
      setTokenPrefix(null)
      setNewToken(null)
      notify.success(t.tokenRevoked)
    } catch {
      notify.error(t.revokeTokenError)
    } finally {
      setTokenLoading(false)
    }
  }

  return (
    <>
      <SettingsCard title={t.mcpUrlTitle} description={t.mcpUrlDescription}>
        <CopyBox value={mcpUrl} field="mcp" copiedField={copiedField} onCopy={copy} />
      </SettingsCard>

      <SettingsCard title={t.scriptTokenTitle} description={t.scriptTokenDescription}>
        {tokenStatus === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" /> {t.loading}
          </p>
        )}
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
          <>
            <CopyBox value={newToken} field="token" copiedField={copiedField} onCopy={copy} tone="primary" />
            <p className="text-xs text-muted-foreground">{t.newTokenHint}</p>
          </>
        )}
      </SettingsCard>

      {!isNostrAuth && apiKey ? (
        <SettingsCard title={t.legacyKeyTitle} description={t.legacyKeyDescription}>
          <SettingRow
            title={<code className="font-mono">{apiKey.slice(0, 8)}…{apiKey.slice(-6)}</code>}
            action={
              <button type="button" onClick={() => copy("key", apiKey)} className={settingsButtonClass()}>
                {copiedField === "key" ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
                {copiedField === "key" ? t.copied : t.copy}
              </button>
            }
          />
        </SettingsCard>
      ) : null}

      <SettingsCard>
        <SettingRow
          title={t.downloadSkill}
          description={t.downloadSkillHint}
          action={
            <button type="button" onClick={downloadSkill} disabled={downloading} className={settingsButtonClass()}>
              {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t.download}
            </button>
          }
        />
        <SettingsDivider />
        <SettingRow
          title={t.apiDocsTitle}
          description={t.apiDocsDescription}
          action={
            <Link href="/docs/api" target="_blank" className={settingsButtonClass()}>
              <FileCode2 className="h-4 w-4" />
              {t.apiDocsOpen}
            </Link>
          }
        />
      </SettingsCard>
    </>
  )
}
