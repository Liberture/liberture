"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  Copy,
  Database,
  Download,
  LogOut,
  Mic,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react"

import { Avatar } from "@/components/habits/account-header"
import { AssistantAccessSection } from "@/components/habits/assistant-access-section"
import { NostrMigrationCard } from "@/components/habits/nostr-migration-card"
import { SettingRow, SettingsCard, SettingsDivider, settingsButtonClass } from "@/components/habits/settings/settings-ui"
import { Switch } from "@/components/habits/ui/switch"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { getBackupStatus } from "@/lib/habits/backup-status"
import { hexToNpub, shortenNpub } from "@/lib/habits/nostr/crypto"
import { displayNip05, useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import type { Habit, HabitCompletion, Todo } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

interface SettingsDialogProps {
  onExport: () => void
  /** ISO timestamp of the last full export, if there has ever been one. */
  lastBackupAt?: string
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClose: () => void
  habits: Habit[]
  completions: HabitCompletion[]
  todos: Todo[]
  notificationsEnabled: boolean
  onToggleNotifications: (enabled: boolean) => void
  onClearAllData: () => void
  apiKey: string
  isNostrAuth?: boolean
  onLogout: () => void
  linkedNostrPubkey?: string | null
  onNostrMigration?: (pubkey: string, npub: string) => void
  /** Signed-in Nostr pubkey (hex), for the profile card. */
  pubkey?: string | null
  /** The tracker's own profile name, when the Nostr profile has none. */
  profileName?: string | null
}

type Tab = "account" | "assistants" | "reminders" | "data"

const TABS: { id: Tab; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "account", icon: UserRound },
  { id: "assistants", icon: Mic },
  { id: "reminders", icon: Bell },
  { id: "data", icon: Database },
]

const TAB_STORAGE = "habit-tracker-settings-tab"

export function SettingsDialog({
  onExport,
  lastBackupAt,
  onImport,
  onClose,
  habits,
  completions,
  todos,
  notificationsEnabled,
  onToggleNotifications,
  onClearAllData,
  apiKey,
  isNostrAuth = false,
  onLogout,
  linkedNostrPubkey,
  onNostrMigration,
  pubkey = null,
  profileName,
}: SettingsDialogProps) {
  const t = useTranslations().habits.app.settingsDialog
  const [tab, setTab] = useState<Tab>("account")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backupStatus = getBackupStatus(lastBackupAt, habits)
  // Same rules as backupStatus.label (lib/habits/backup-status.ts), in the visitor's language.
  const backupLabel = !backupStatus.neverBackedUp
    ? backupStatus.daysSince === 0
      ? t.backedUpToday
      : backupStatus.daysSince === 1
        ? t.lastBackupYesterday
        : formatMessage(t.lastBackupDaysAgo, { count: backupStatus.daysSince ?? 0 })
    : habits.some((h) => !h.archived)
      ? t.neverBackedUp
      : t.nothingToBackUp

  // Reopen on the tab used last; a convenience, so failures are ignored.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE) as Tab | null
      if (saved && TABS.some((t) => t.id === saved)) setTab(saved)
    } catch {}
  }, [])
  const chooseTab = (next: Tab) => {
    setTab(next)
    try {
      localStorage.setItem(TAB_STORAGE, next)
    } catch {}
  }

  // Escape closes, and the page behind shouldn't scroll while the sheet is open.
  useEffect(() => {
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
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur-sm duration-200 animate-in fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(event) => event.stopPropagation()}
        className="flex h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl duration-200 animate-in slide-in-from-bottom-6 sm:h-[min(760px,90dvh)] sm:rounded-2xl sm:zoom-in-95 sm:slide-in-from-bottom-0"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-lg font-bold text-foreground">{t.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* Tabs: a row of pills on phones, a sidebar from sm up. */}
          <nav
            aria-label={t.sections}
            className="custom-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 py-2 sm:w-52 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:px-3 sm:py-4"
          >
            {TABS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.tabs[id]}
              </button>
            ))}
          </nav>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {tab === "account" && (
              <AccountTab
                apiKey={apiKey}
                isNostrAuth={isNostrAuth}
                pubkey={pubkey}
                profileName={profileName}
                linkedNostrPubkey={linkedNostrPubkey}
                onNostrMigration={onNostrMigration}
                onLogout={onLogout}
                stats={[
                  { label: t.statHabits, value: habits.filter((h) => !h.archived).length },
                  { label: t.statCheckIns, value: completions.filter((c) => c.completed).length },
                  { label: t.statOpenTodos, value: todos.filter((t) => t.status !== "completed").length },
                  { label: t.statDoneTodos, value: todos.filter((t) => t.status === "completed").length },
                ]}
              />
            )}

            {tab === "assistants" && <AssistantAccessSection apiKey={apiKey} isNostrAuth={isNostrAuth} />}

            {tab === "reminders" && <RemindersTab enabled={notificationsEnabled} onToggle={onToggleNotifications} />}

            {tab === "data" && (
              <>
                <SettingsCard title={t.backupTitle} description={t.backupDescription}>
                  <SettingRow
                    title={t.export}
                    description={<span className={cn(backupStatus.overdue && "text-exercise")}>{backupLabel}</span>}
                    action={
                      <button type="button" onClick={onExport} className={settingsButtonClass("primary")}>
                        <Download className="h-4 w-4" />
                        {t.export}
                      </button>
                    }
                  />
                  <SettingsDivider />
                  <SettingRow
                    title={t.import}
                    description={t.importDescription}
                    action={
                      <button type="button" onClick={() => fileInputRef.current?.click()} className={settingsButtonClass()}>
                        <Upload className="h-4 w-4" />
                        {t.import}
                      </button>
                    }
                  />
                </SettingsCard>

                <SettingsCard title={t.dangerZone} tone="danger">
                  <SettingRow
                    title={t.clearAllData}
                    description={t.clearAllDataDescription}
                    action={
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t.clearAllDataConfirm)) {
                            onClearAllData()
                            onClose()
                          }
                        }}
                        className={settingsButtonClass("danger")}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t.clear}
                      </button>
                    }
                  />
                </SettingsCard>
              </>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".json" onChange={onImport} className="hidden" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Account

interface AccountTabProps {
  apiKey: string
  isNostrAuth: boolean
  pubkey: string | null
  profileName?: string | null
  linkedNostrPubkey?: string | null
  onNostrMigration?: (pubkey: string, npub: string) => void
  onLogout: () => void
  stats: { label: string; value: number }[]
}

function AccountTab({ apiKey, isNostrAuth, pubkey, profileName, linkedNostrPubkey, onNostrMigration, onLogout, stats }: AccountTabProps) {
  const t = useTranslations().habits.app.settingsDialog
  const profile = useNostrProfile(isNostrAuth ? pubkey : null)
  const [copied, setCopied] = useState<string | null>(null)
  const [migratedNpub, setMigratedNpub] = useState<string | null>(null)
  const npub = pubkey && /^[0-9a-f]{64}$/.test(pubkey) ? hexToNpub(pubkey) : null
  const name = profile?.name ?? profileName ?? (isNostrAuth ? t.nostrAccount : t.yourAccount)

  const copy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const handleMigrationComplete = useCallback(
    (newPubkey: string, newNpub: string) => {
      setMigratedNpub(newNpub)
      onNostrMigration?.(newPubkey, newNpub)
    },
    [onNostrMigration]
  )

  return (
    <>
      <SettingsCard>
        <div className="flex items-center gap-4">
          <Avatar src={profile?.picture ?? null} name={name} size={56} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{name}</p>
            {profile?.nip05 ? (
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <span className="truncate">{displayNip05(profile.nip05)}</span>
                {profile.nip05Verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t.verified} /> : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{isNostrAuth ? t.signedInWithNostr : t.signedInWithApiKey}</p>
            )}
          </div>
        </div>

        {npub ? (
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-hidden whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
              {shortenNpub(npub, 10)}
            </code>
            <button type="button" onClick={() => copy("npub", npub)} className={settingsButtonClass()}>
              {copied === "npub" ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
              {copied === "npub" ? t.copied : t.copyNpub}
            </button>
          </div>
        ) : null}

        {!isNostrAuth ? (
          <SettingRow
            title={t.apiKey}
            description={<code className="font-mono">{apiKey.slice(0, 8)}…{apiKey.slice(-6)}</code>}
            action={
              <button type="button" onClick={() => copy("key", apiKey)} className={settingsButtonClass()}>
                {copied === "key" ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
                {copied === "key" ? t.copied : t.copy}
              </button>
            }
          />
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </SettingsCard>

      {!isNostrAuth ? (
        <SettingsCard title={t.nostrIdentity} description={t.nostrIdentityDescription}>
          {linkedNostrPubkey || migratedNpub ? (
            <SettingRow
              title={
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-nutrition" />
                  {t.linked}
                </span>
              }
              description={<code className="font-mono">{shortenNpub(migratedNpub || linkedNostrPubkey || "", 12)}</code>}
            />
          ) : (
            <NostrMigrationCard apiKey={apiKey} onMigrationComplete={handleMigrationComplete} />
          )}
        </SettingsCard>
      ) : null}

      <SettingsCard>
        <SettingRow
          title={t.signOut}
          description={isNostrAuth ? t.signOutNostrDescription : t.signOutApiKeyDescription}
          action={
            <button type="button" onClick={onLogout} className={settingsButtonClass("danger")}>
              <LogOut className="h-4 w-4" />
              {t.signOut}
            </button>
          }
        />
      </SettingsCard>
    </>
  )
}

// ---------------------------------------------------------------- Reminders

function RemindersTab({ enabled, onToggle }: { enabled: boolean; onToggle: (enabled: boolean) => void }) {
  const t = useTranslations().habits.app.settingsDialog
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [swRegistered, setSwRegistered] = useState<boolean | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported")
    // Whether a service worker is registered decides whether reminders can
    // reach Android at all, so it's surfaced rather than left to the console.
    if (!("serviceWorker" in navigator)) return setSwRegistered(false)
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => setSwRegistered(Boolean(reg)))
      .catch(() => setSwRegistered(false))
  }, [])

  const toggle = async (next: boolean) => {
    if (!("Notification" in window)) return
    if (next && Notification.permission === "default") {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== "granted") return
    }
    onToggle(next)
  }

  /**
   * Mirrors NotificationManager's delivery path exactly, and reports which one
   * worked. A silent no-op is the worst outcome here — if reminders don't reach
   * a device, the reason has to be visible.
   */
  const sendTest = async () => {
    setTestResult(null)
    if (!("Notification" in window)) return setTestResult({ ok: false, message: t.testNoNotificationApi })
    if (Notification.permission !== "granted") {
      return setTestResult({ ok: false, message: formatMessage(t.testPermissionNotGranted, { permission: t.permissionStates[Notification.permission] }) })
    }
    const options: NotificationOptions = { body: t.testNotificationBody, icon: "/pwa-icon-192.png", badge: "/icon-dark-32x32.png", tag: "habit-test" }
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null
      if (registration) {
        await registration.showNotification("Liberture", options)
        return setTestResult({ ok: true, message: t.testSentServiceWorker })
      }
      new Notification("Liberture", options)
      setTestResult({ ok: true, message: t.testSentNotificationApi })
    } catch (error) {
      setTestResult({ ok: false, message: error instanceof Error ? error.message : t.testUnknownError })
    }
  }

  const blocked = permission === "denied" || permission === "unsupported"

  return (
    <SettingsCard title={t.remindersTitle} description={t.remindersDescription}>
      <SettingRow
        htmlFor="reminders-switch"
        title={t.remindMe}
        description={
          permission === "denied"
            ? t.remindersBlocked
            : permission === "unsupported"
              ? t.remindersUnsupported
              : enabled
                ? t.remindersOn
                : t.remindersOff
        }
        action={<Switch id="reminders-switch" checked={enabled && !blocked} disabled={blocked} onCheckedChange={toggle} />}
      />

      <SettingsDivider />

      <button
        type="button"
        onClick={() => setShowDiagnostics((v) => !v)}
        aria-expanded={showDiagnostics}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {t.troubleshoot}
        <ChevronDown className={cn("h-4 w-4 transition-transform", showDiagnostics && "rotate-180")} />
      </button>

      {showDiagnostics && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{t.browserPermission}</p>
              <p className={cn("mt-1 text-sm font-semibold capitalize", permission === "granted" ? "text-nutrition" : permission === "denied" ? "text-destructive" : "text-exercise")}>
                {t.permissionStates[permission]}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{t.serviceWorker}</p>
              <p className={cn("mt-1 text-sm font-semibold", swRegistered ? "text-nutrition" : "text-exercise")}>
                {swRegistered === null ? t.checking : swRegistered ? t.registered : t.notRegistered}
              </p>
            </div>
          </div>
          <SettingRow
            title={t.sendTest}
            description={t.sendTestDescription}
            action={
              <button type="button" onClick={sendTest} className={settingsButtonClass()}>
                <Bell className="h-4 w-4" />
                {t.test}
              </button>
            }
          />
          {testResult && (
            <p
              className={cn(
                "rounded-lg border p-3 text-xs",
                testResult.ok ? "border-nutrition/30 bg-nutrition/10 text-nutrition" : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              {testResult.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t.diagnosticsFootnote}
          </p>
        </div>
      )}
    </SettingsCard>
  )
}
