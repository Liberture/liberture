import type { Habit } from "@/lib/habits/types"

/**
 * How overdue a backup is.
 *
 * All the awkward cases live here rather than in the banner, because "when did
 * you last back up" has three answers, not two: recently, a while ago, and
 * never. Never is the one that matters — it is both the most common state and
 * the easiest to get wrong, since a brand-new account has also never backed up
 * and should obviously not be nagged about it.
 */

/** A week. Long enough that the banner stays meaningful, short enough that a lapse costs little. */
export const BACKUP_INTERVAL_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export interface BackupStatus {
  /** Whether to nag. False for accounts too new or too empty to have anything to lose. */
  overdue: boolean
  /** Days since the last backup, or since the account had data if never backed up. */
  daysSince: number | null
  neverBackedUp: boolean
  /** Ready to render: "Last backup: 12 days ago", "Never backed up", "Backed up today". */
  label: string
}

/**
 * The later of two backup timestamps, either of which may be absent.
 *
 * The server records a backup when /api/v1/export runs, while the client sends
 * the whole blob back on every autosave. A client that loaded before that
 * export would otherwise save the field back to undefined and lose it. ISO-8601
 * sorts lexicographically, so no parsing is needed to compare them.
 */
export function laterBackupAt(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b
  if (!b) return a
  return a > b ? a : b
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS)
}

function parse(value: string | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Earliest sign this account has data worth losing.
 *
 * Used as the clock start when someone has never exported. Without it the
 * choice is between nagging on day one and never nagging at all, and neither is
 * right: what we actually want is "you have had real data for a week and have
 * never backed it up".
 */
function dataSince(habits: Habit[]): Date | null {
  let earliest: Date | null = null
  for (const habit of habits) {
    const created = parse(habit.createdAt)
    if (created && (!earliest || created < earliest)) earliest = created
  }
  return earliest
}

export function getBackupStatus(
  lastBackupAt: string | undefined,
  habits: Habit[],
  now: Date = new Date()
): BackupStatus {
  const active = habits.filter((h) => !h.archived)
  const lastBackup = parse(lastBackupAt)

  if (lastBackup) {
    const daysSince = Math.max(0, daysBetween(lastBackup, now))
    return {
      overdue: daysSince >= BACKUP_INTERVAL_DAYS,
      daysSince,
      neverBackedUp: false,
      label:
        daysSince === 0
          ? "Backed up today"
          : daysSince === 1
            ? "Last backup: yesterday"
            : `Last backup: ${daysSince} days ago`,
    }
  }

  // Never exported. Only worth mentioning once there is something to lose.
  const since = dataSince(active)
  const daysSince = since ? Math.max(0, daysBetween(since, now)) : null

  return {
    overdue: active.length > 0 && daysSince !== null && daysSince >= BACKUP_INTERVAL_DAYS,
    daysSince,
    neverBackedUp: true,
    label: active.length === 0 ? "Nothing to back up yet" : "Never backed up",
  }
}
