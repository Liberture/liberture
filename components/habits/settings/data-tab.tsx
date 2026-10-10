"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Download, LogOut, Trash2, Upload } from "lucide-react"

import { SettingRow, SettingsCard, SettingsDivider, settingsButtonClass, settingsInputClass } from "@/components/habits/settings/settings-ui"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { notify } from "@/components/habits/ui/toast"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { getBackupStatus } from "@/lib/habits/backup-status"
import type { Habit, StorageData } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

/** What a backup file parses to; only the arrays the app knows are guaranteed to be arrays. */
export type BackupImport = Partial<StorageData>

const COLLECTIONS = ["habits", "completions", "todos", "projects", "calendarEvents"] as const

/** Reads a backup file's JSON, or null when it isn't one. */
export function parseBackup(text: string): BackupImport | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null
  const record = { ...(data as Record<string, unknown>) }
  let found = false
  for (const key of COLLECTIONS) {
    if (Array.isArray(record[key])) found = true
    else delete record[key]
  }
  return found ? (record as BackupImport) : null
}

interface DataTabProps {
  habits: Habit[]
  lastBackupAt?: string
  onExport: () => void
  onImport: (backup: BackupImport) => void
  /** Resolves true once the server reset the account. */
  onResetAccount: () => Promise<boolean>
  onLogout: () => void
  isNostrAuth: boolean
  /** Closes Settings itself (after clearing everything). */
  onCloseSettings: () => void
}

export function DataTab({ habits, lastBackupAt, onExport, onImport, onResetAccount, onLogout, isNostrAuth, onCloseSettings }: DataTabProps) {
  const copy = useTranslations().habits.app
  const t = copy.settingsDialog
  const locale = useLocale()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{ fileName: string; backup: BackupImport } | null>(null)
  const [clearing, setClearing] = useState(false)
  const [clearText, setClearText] = useState("")
  const [signingOut, setSigningOut] = useState(false)

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

  const readFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    // Reset so choosing the same file again still fires onChange.
    input.value = ""
    if (!file) return
    file
      .text()
      .then((text) => {
        const backup = parseBackup(text)
        if (backup) setPreview({ fileName: file.name, backup })
        else notify.error(t.data.importInvalid)
      })
      .catch(() => notify.error(t.data.importUnreadable))
  }

  const confirmImport = () => {
    if (!preview) return
    onImport(preview.backup)
    setPreview(null)
  }

  const closeClear = () => {
    setClearing(false)
    setClearText("")
  }
  const clearMatches = clearText.trim().toUpperCase() === t.data.clearWord.toUpperCase()
  const [resetting, setResetting] = useState(false)
  const confirmClear = async () => {
    if (!clearMatches || resetting) return
    setResetting(true)
    const done = await onResetAccount()
    setResetting(false)
    if (!done) return // the error toast is up; the dialog stays so they can retry
    closeClear()
    onCloseSettings()
  }

  const backupDate = preview ? (preview.backup.lastBackupAt ?? preview.backup.lastUpdated) : undefined
  const formattedDate = backupDate && !Number.isNaN(Date.parse(backupDate))
    ? new Date(backupDate).toLocaleString(locale === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" })
    : null
  const counts = preview
    ? ([
        [t.data.counts.habits, preview.backup.habits?.length ?? 0],
        [t.data.counts.completions, preview.backup.completions?.length ?? 0],
        [t.data.counts.todos, preview.backup.todos?.length ?? 0],
        [t.data.counts.projects, preview.backup.projects?.length ?? 0],
        [t.data.counts.events, preview.backup.calendarEvents?.length ?? 0],
      ] as const)
    : []

  return (
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={readFile}
          className="hidden"
          aria-label={t.import}
          tabIndex={-1}
        />
      </SettingsCard>

      <SettingsCard title={t.data.accountTitle}>
        <SettingRow
          title={t.signOut}
          description={isNostrAuth ? t.signOutNostrDescription : t.signOutApiKeyDescription}
          action={
            <button type="button" onClick={() => setSigningOut(true)} className={settingsButtonClass("danger")}>
              <LogOut className="h-4 w-4" />
              {t.signOut}
            </button>
          }
        />
      </SettingsCard>

      <SettingsCard title={t.dangerZone} tone="danger">
        <SettingRow
          title={t.clearAllData}
          description={t.clearAllDataDescription}
          action={
            <button type="button" onClick={() => setClearing(true)} className={settingsButtonClass("danger")}>
              <Trash2 className="h-4 w-4" />
              {t.clear}
            </button>
          }
        />
      </SettingsCard>

      <AppDialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={t.data.importPreviewTitle}
        description={preview?.fileName}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setPreview(null)} className={settingsButtonClass()}>
              {copy.common.cancel}
            </button>
            <button type="button" onClick={confirmImport} className={settingsButtonClass("danger")}>
              {t.data.importConfirm}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {formattedDate ? formatMessage(t.data.importBackupDate, { date: formattedDate }) : t.data.importNoDate}
          </p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {counts.map(([label, count]) => (
              <div key={label} className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-bold text-foreground">{count}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-destructive">{t.data.importReplaceTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.data.importReplaceDescription}</p>
          </div>
        </div>
      </AppDialog>

      <AppDialog
        open={clearing}
        onClose={closeClear}
        title={t.data.clearTitle}
        size="sm"
        footer={
          <>
            <button type="button" onClick={closeClear} className={settingsButtonClass()}>
              {copy.common.cancel}
            </button>
            <button type="button" onClick={confirmClear} disabled={!clearMatches || resetting} className={settingsButtonClass("danger")}>
              <Trash2 className="h-4 w-4" />
              {resetting ? t.data.clearWorking : t.data.clearConfirm}
            </button>
          </>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            confirmClear()
          }}
        >
          <p className="text-sm text-muted-foreground">{t.data.clearDescription}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {t.data.clearDeletes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{t.data.clearKeeps}</p>
          <label htmlFor="clear-confirm" className="block text-sm font-medium text-foreground">
            {formatMessage(t.data.clearTypeToConfirm, { word: t.data.clearWord })}
          </label>
          <input
            id="clear-confirm"
            data-autofocus
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={clearText}
            onChange={(event) => setClearText(event.target.value)}
            className={settingsInputClass}
          />
        </form>
      </AppDialog>

      <AppDialog
        open={signingOut}
        onClose={() => setSigningOut(false)}
        title={t.data.signOutTitle}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setSigningOut(false)} className={settingsButtonClass()}>
              {copy.common.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                setSigningOut(false)
                onLogout()
              }}
              className={settingsButtonClass("danger")}
            >
              <LogOut className="h-4 w-4" />
              {t.signOut}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{copy.common.signOutConfirm}</p>
      </AppDialog>
    </>
  )
}
