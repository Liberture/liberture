"use client"

import type React from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { Bell, Code2, Database, Mic, SlidersHorizontal, UserRound, X } from "lucide-react"

import { AssistantConnectSection, DeveloperSection } from "@/components/habits/assistant-access-section"
import { DataTab, type BackupImport } from "@/components/habits/settings/data-tab"
import { PreferencesTab } from "@/components/habits/settings/preferences-tab"
import { ProfileTab } from "@/components/habits/settings/profile-tab"
import { RemindersTab } from "@/components/habits/settings/reminders-tab"
import { SETTINGS_TABS, toSettingsTab, type SettingsTab } from "@/components/habits/settings/settings-tabs"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { useTranslations } from "@/components/i18n/locale-provider"
import type { Habit, UserPreferences, UserProfile } from "@/lib/habits/types"
import { DEFAULT_PREFERENCES } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

export type { SettingsTab } from "@/components/habits/settings/settings-tabs"
export type { BackupImport } from "@/components/habits/settings/data-tab"

interface SettingsDialogProps {
  onClose: () => void
  /** Opens on this tab; otherwise the one used last. */
  initialTab?: SettingsTab
  habits: Habit[]
  // Profile
  profile?: UserProfile
  onProfileChange: (patch: Partial<UserProfile>) => void
  /** Signed-in Nostr pubkey (hex), for the profile card. */
  pubkey?: string | null
  linkedNostrPubkey?: string | null
  onNostrMigration?: (pubkey: string, npub: string) => void
  // Preferences and reminders
  preferences: UserPreferences
  onPreferencesChange: (patch: Partial<UserPreferences>) => void
  /** Reminders on/off, if the parent tracks it apart from preferences.notifications. Toggling writes preferences.notifications. */
  notificationsEnabled?: boolean
  // Assistants / developer
  apiKey: string
  isNostrAuth?: boolean
  // Data and account
  onExport: () => void
  /** ISO timestamp of the last full export, if there has ever been one. */
  lastBackupAt?: string
  /** A parsed backup the user has previewed and confirmed: replace everything with it. */
  onImport: (backup: BackupImport) => void
  /** Resolves true once the account was deleted. */
  onDeleteAccount: () => Promise<boolean>
  onLogout: () => void
}

const TAB_ICONS: Record<SettingsTab, React.ComponentType<{ className?: string }>> = {
  profile: UserRound,
  preferences: SlidersHorizontal,
  reminders: Bell,
  assistants: Mic,
  developer: Code2,
  data: Database,
}

const TAB_STORAGE = "habit-tracker-settings-tab"

export function SettingsDialog({
  onClose,
  initialTab,
  habits,
  profile,
  onProfileChange,
  pubkey = null,
  linkedNostrPubkey,
  onNostrMigration,
  preferences,
  onPreferencesChange,
  notificationsEnabled,
  apiKey,
  isNostrAuth = false,
  onExport,
  lastBackupAt,
  onImport,
  onDeleteAccount,
  onLogout,
}: SettingsDialogProps) {
  const t = useTranslations().habits.app.settingsDialog
  const idBase = useId()
  const [tab, setTab] = useState<SettingsTab>(initialTab ?? "profile")
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement | null>>>({})

  // Reopen on the tab used last unless the caller asked for one; a
  // convenience, so storage failures are ignored.
  useEffect(() => {
    if (initialTab) return
    try {
      const saved = toSettingsTab(localStorage.getItem(TAB_STORAGE))
      if (saved) setTab(saved)
    } catch {}
  }, [initialTab])

  const chooseTab = (next: SettingsTab, focus = false) => {
    setTab(next)
    if (focus) tabRefs.current[next]?.focus()
    try {
      localStorage.setItem(TAB_STORAGE, next)
    } catch {}
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onTabKeyDown = (event: React.KeyboardEvent) => {
    const index = SETTINGS_TABS.indexOf(tab)
    const last = SETTINGS_TABS.length - 1
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? SETTINGS_TABS[index === last ? 0 : index + 1]
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? SETTINGS_TABS[index === 0 ? last : index - 1]
          : event.key === "Home"
            ? SETTINGS_TABS[0]
            : event.key === "End"
              ? SETTINGS_TABS[last]
              : null
    if (!next) return
    event.preventDefault()
    chooseTab(next, true)
  }

  // A confirm or preview dialog opened from a tab sits on top of this one and
  // owns Escape; both listen on window and this one hears it first.
  const handleClose = useCallback(() => {
    if (document.querySelectorAll('[role="dialog"][aria-modal="true"]').length > 1) return
    onClose()
  }, [onClose])

  const tabId = (id: SettingsTab) => `${idBase}-tab-${id}`
  const panelId = (id: SettingsTab) => `${idBase}-panel-${id}`

  const header = (
    <div className="space-y-2 px-4 pt-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
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
      <div
        role="tablist"
        aria-label={t.sections}
        aria-orientation="horizontal"
        onKeyDown={onTabKeyDown}
        className="custom-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-2"
      >
        {SETTINGS_TABS.map((id) => {
          const Icon = TAB_ICONS[id]
          const selected = tab === id
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el
              }}
              id={tabId(id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={selected ? panelId(id) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => chooseTab(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.tabs[id]}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <AppDialog
      open
      onClose={handleClose}
      title={t.title}
      size="lg"
      header={header}
      className="h-[92dvh] sm:h-[min(760px,90dvh)] sm:max-w-4xl"
    >
      <div role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)} tabIndex={0} className="space-y-4 outline-none">
        {tab === "profile" && (
          <ProfileTab
            apiKey={apiKey}
            isNostrAuth={isNostrAuth}
            pubkey={pubkey}
            profile={profile}
            onProfileChange={onProfileChange}
            habits={habits}
            linkedNostrPubkey={linkedNostrPubkey}
            onNostrMigration={onNostrMigration}
          />
        )}

        {tab === "preferences" && <PreferencesTab preferences={preferences} onPreferencesChange={onPreferencesChange} />}

        {tab === "reminders" && (
          <RemindersTab
            enabled={notificationsEnabled ?? preferences.notifications ?? DEFAULT_PREFERENCES.notifications}
            onToggle={(notifications) => onPreferencesChange({ notifications })}
          />
        )}

        {tab === "assistants" && <AssistantConnectSection apiKey={apiKey} isNostrAuth={isNostrAuth} />}

        {tab === "developer" && <DeveloperSection apiKey={apiKey} isNostrAuth={isNostrAuth} />}

        {tab === "data" && (
          <DataTab
            habits={habits}
            lastBackupAt={lastBackupAt}
            onExport={onExport}
            onImport={onImport}
            onDeleteAccount={onDeleteAccount}
            onLogout={onLogout}
            isNostrAuth={isNostrAuth}
            onCloseSettings={onClose}
          />
        )}
      </div>
    </AppDialog>
  )
}
