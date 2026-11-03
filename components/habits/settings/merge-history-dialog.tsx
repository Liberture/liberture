"use client"

import { useCallback, useEffect, useState } from "react"
import { GitMerge } from "lucide-react"

import { settingsButtonClass, settingsInputClass } from "@/components/habits/settings/settings-ui"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { notify } from "@/components/habits/ui/toast"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import type { Habit } from "@/lib/habits/types"

/** The parts of POST /api/import/habit-history's answer this dialog shows. */
interface ImportResult {
  imported: number
  merged: number
  skipped: number
  conflicts: number
  unresolved: number
  failed: number
  habitMapping: Array<{
    oldHabitId: string
    oldName: string | null
    newHabitId: string | null
    status: "mapped" | "ambiguous" | "unmatched"
    records: number
  }>
}

interface MergeHistoryDialogProps {
  /** The parsed backup file, or null when closed. */
  backup: { fileName: string; data: unknown } | null
  habits: Habit[]
  apiKey?: string
  onClose: () => void
}

function timeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

/**
 * Settings → Data → Merge history. Previews the import (dryRun) as soon as a
 * file is chosen, lets the user correct or confirm each habit match (nothing
 * ambiguous is matched for them), previews again on every change, and only
 * then writes. The tracker picks the new history up through its live refresh.
 */
export function MergeHistoryDialog({ backup, habits, apiKey, onClose }: MergeHistoryDialogProps) {
  const t = useTranslations().habits.app.settingsDialog.data.merge
  const common = useTranslations().habits.app.common
  const [result, setResult] = useState<ImportResult | null>(null)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const send = useCallback(
    async (dryRun: boolean, mapping: Record<string, string>): Promise<ImportResult | null> => {
      if (!backup) return null
      const response = await fetch("/api/import/habit-history", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({
          data: backup.data,
          dryRun,
          timeZone: timeZone(),
          // "" = leave pending on purpose.
          habitMapping: Object.entries(mapping).map(([oldHabitId, newHabitId]) => ({ oldHabitId, newHabitId: newHabitId || null })),
        }),
      })
      if (!response.ok) return null
      return (await response.json()) as ImportResult
    },
    [backup, apiKey]
  )

  useEffect(() => {
    if (!backup) {
      setResult(null)
      setChoices({})
      return
    }
    let cancelled = false
    setLoading(true)
    send(true, choices)
      .then((preview) => {
        if (cancelled) return
        if (preview) setResult(preview)
        else {
          notify.error(t.invalid)
          onClose()
        }
      })
      .catch(() => {
        if (!cancelled) notify.error(t.failed)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // Re-preview whenever the user changes a match.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backup, choices])

  const confirm = async () => {
    setSaving(true)
    try {
      const done = await send(false, choices)
      if (!done) {
        notify.error(t.failed)
        return
      }
      notify.success(formatMessage(t.done, { imported: done.imported + done.merged, skipped: done.skipped, conflicts: done.conflicts, unresolved: done.unresolved }))
      onClose()
    } catch {
      notify.error(t.failed)
    } finally {
      setSaving(false)
    }
  }

  const toAdd = result ? result.imported + result.merged : 0
  const counts = result
    ? ([
        [t.counts.imported, toAdd],
        [t.counts.skipped, result.skipped],
        [t.counts.conflicts, result.conflicts],
        [t.counts.unresolved, result.unresolved],
        [t.counts.failed, result.failed],
      ] as const)
    : []
  const sortedHabits = [...habits].sort((a, b) => Number(Boolean(a.archived)) - Number(Boolean(b.archived)) || a.name.localeCompare(b.name))

  return (
    <AppDialog
      open={backup !== null}
      onClose={onClose}
      title={t.title}
      description={backup?.fileName}
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className={settingsButtonClass()}>
            {common.cancel}
          </button>
          <button type="button" onClick={confirm} disabled={!result || loading || saving || toAdd === 0} className={settingsButtonClass("primary")}>
            <GitMerge className="h-4 w-4" />
            {saving ? t.working : toAdd ? formatMessage(t.confirm, { count: toAdd }) : t.nothingToAdd}
          </button>
        </>
      }
    >
      {!result ? (
        <p className="text-sm text-muted-foreground">{t.checking}</p>
      ) : (
        <div className="space-y-4" aria-busy={loading}>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {counts.map(([label, count]) => (
              <div key={label} className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-bold text-foreground">{count}</dd>
              </div>
            ))}
          </dl>
          {result.conflicts > 0 ? <p className="text-xs leading-relaxed text-muted-foreground">{t.conflictsHint}</p> : null}

          <div>
            <h4 className="text-sm font-semibold text-foreground">{t.matchesTitle}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.matchesHint}</p>
            <ul className="mt-3 space-y-2">
              {result.habitMapping.map((m) => {
                const value = m.oldHabitId in choices ? choices[m.oldHabitId] : m.newHabitId ?? ""
                const id = `merge-${m.oldHabitId}`
                return (
                  <li key={m.oldHabitId} className="flex flex-col gap-1.5 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:gap-3">
                    <label htmlFor={id} className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{m.oldName ?? t.notInBackup}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatMessage(t.records, { count: m.records })}
                        {m.status === "ambiguous" && !(m.oldHabitId in choices) ? ` · ${t.needsConfirming}` : ""}
                      </span>
                    </label>
                    <select
                      id={id}
                      value={value}
                      disabled={loading || saving}
                      onChange={(event) => setChoices((prev) => ({ ...prev, [m.oldHabitId]: event.target.value }))}
                      className={`${settingsInputClass} sm:w-56`}
                    >
                      <option value="">{t.leavePending}</option>
                      {sortedHabits.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </AppDialog>
  )
}
