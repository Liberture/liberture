"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
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
import { Tabs, TabOptions, TabsContent } from "@/components/ui/tabs"

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
  const [tab, setTab] = useState<SettingsTab>(initialTab ?? "profile")

  // Reopen on the tab used last unless the caller asked for one; a
  // convenience, so storage failures are ignored.
  useEffect(() => {
    if (initialTab) return
    try {
      const saved = toSettingsTab(localStorage.getItem(TAB_STORAGE))
      if (saved) setTab(saved)
    } catch {}
  }, [initialTab])

  const chooseTab = (next: SettingsTab) => {
    setTab(next)
    try {
      localStorage.setItem(TAB_STORAGE, next)
    } catch {}
  }

  // A confirm or preview dialog opened from a tab sits on top of this one and
  // owns Escape; both listen on window and this one hears it first.
  const handleClose = useCallback(() => {
    if (document.querySelectorAll('[role="dialog"][aria-modal="true"]').length > 1) return
    onClose()
  }, [onClose])


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
      <TabOptions ids={SETTINGS_TABS} icons={TAB_ICONS}
        labels={t.tabs} label={t.sections} />
    </div>
  )

  return (
    <Tabs variant="embedded" value={tab} onValueChange={value => chooseTab(value as SettingsTab)}>
    <AppDialog
      open
      onClose={handleClose}
      title={t.title}
      size="lg"
      header={header}
      className="h-[92dvh] sm:h-[min(760px,90dvh)] sm:max-w-4xl"
    >
      <TabsContent value={tab} className="space-y-4">
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
            receipts={preferences.assistantLogPush ?? DEFAULT_PREFERENCES.assistantLogPush}
            onReceiptsToggle={(assistantLogPush) => onPreferencesChange({ assistantLogPush })}
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
      </TabsContent>
    </AppDialog>
    </Tabs>
  )
}
