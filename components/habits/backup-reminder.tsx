"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, ShieldAlert, X } from "lucide-react"

import { getBackupStatus } from "@/lib/habits/backup-status"
import type { Habit } from "@/lib/habits/types"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

interface BackupReminderProps {
  habits: Habit[]
  lastBackupAt?: string
  onExport: () => void
}

/** Snoozing hides it for this long, then it comes back if still not backed up. */
const SNOOZE_DAYS = 3
const SNOOZE_KEY = "habit-tracker-backup-snoozed-until"

/**
 * Nudges the user to export when they have not in a while.
 *
 * Dismissal snoozes rather than hides forever. A banner you can permanently
 * kill is one people kill on day one and then lose a year of data behind; a
 * banner with no dismissal at all becomes furniture and stops being read.
 * Three days is short enough to still matter and long enough not to nag.
 *
 * The snooze lives in localStorage, not the storage blob: it is a property of
 * "this person, on this device, right now", and syncing it would mean
 * dismissing on a phone silences the desktop where they'd actually do it.
 */
export function BackupReminder({ habits, lastBackupAt, onExport }: BackupReminderProps) {
  const t = useTranslations().habits.app.backupReminder
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null)
  // Rendered only after mount: localStorage is unavailable during SSR, and
  // guessing wrong flashes the banner at someone who dismissed it.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = Number(localStorage.getItem(SNOOZE_KEY))
      setSnoozedUntil(Number.isFinite(stored) && stored > 0 ? stored : null)
    } catch {}
  }, [])

  const snooze = useCallback(() => {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000
    try {
      localStorage.setItem(SNOOZE_KEY, String(until))
    } catch {}
    setSnoozedUntil(until)
  }, [])

  const handleExport = useCallback(() => {
    onExport()
    // Clear the snooze: the reason for it is gone, and leaving it set would
    // suppress a genuine reminder three days from now.
    try {
      localStorage.removeItem(SNOOZE_KEY)
    } catch {}
    setSnoozedUntil(null)
  }, [onExport])

  if (!mounted) return null

  const status = getBackupStatus(lastBackupAt, habits)
  if (!status.overdue) return null
  if (snoozedUntil && Date.now() < snoozedUntil) return null

  const headline = status.neverBackedUp
    ? t.neverBackedUp
    : plural(t.daysSinceBackup, status.daysSince ?? 0)

  return (
    <div className="flex items-start gap-3 rounded-xl border border-exercise/30 bg-exercise/10 p-3">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-exercise" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{headline}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t.description}
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {t.backUpNow}
        </button>
      </div>
      <button
        type="button"
        onClick={snooze}
        aria-label={formatMessage(t.remindLater, { count: SNOOZE_DAYS })}
        title={formatMessage(t.remindLater, { count: SNOOZE_DAYS })}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
