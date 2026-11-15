import { getDb } from "@/lib/habits/db"
import { formatDateInTimeZone } from "@/lib/habits/date-utils"
import { refreshStorageJsonFromOptimizedTables, syncOptimizedStorageTablesIfEmpty, upsertTodoRow } from "@/lib/habits/optimized-storage"
import type { ChallengeRow } from "./server"
import type { RaceProgress } from "./types"

type Sql = ReturnType<typeof getDb>

// The refund deadline fixes the daily schedule before either deposit is locked.
export async function createRaceTasks(tx: Sql, row: ChallengeRow) {
  const s = row.state
  if (!s.expiresAt) return
  const start = new Date((s.expiresAt - s.durationDays * 86400) * 1000)
  const now = new Date().toISOString()
  for (const owner of [row.creator_id, row.player_id].filter((id): id is number => id !== null).sort((a,b) => a-b)) {
    const [user] = await tx`SELECT data FROM habit_users WHERE id=${owner} FOR UPDATE`
    await syncOptimizedStorageTablesIfEmpty(tx, owner, user.data ?? {})
    const first = formatDateInTimeZone(start, user.data?.preferences?.timeZone ?? "UTC")
    for (let day = 1; day <= s.durationDays; day++) {
      const date = new Date(first + "T00:00:00Z")
      date.setUTCDate(date.getUTCDate() + day - 1)
      await upsertTodoRow(tx, owner, {
        id: `challenge-${s.id}-${day}`, challengeId: s.id, challengeDay: day, title: s.title,
        description: s.rules, dueDate: date.toISOString().slice(0,10), priority: 3,
        status: "incomplete", createdAt: now, updatedAt: now,
      })
    }
    await refreshStorageJsonFromOptimizedTables(tx, owner, ["todos"], now)
  }
}

export async function raceProgress(row: ChallengeRow): Promise<RaceProgress | undefined> {
  const s = row.state
  if (!s.deposits.creator || !s.deposits.player) return
  if (!s.raceTasksCreated) {
    // Repair matches that were funded before daily tasks existed. Lock once per match.
    await getDb().begin(async tx => {
      const [current] = await tx<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE id=${row.id} FOR UPDATE`
      if (current.state.raceTasksCreated) return
      await createRaceTasks(tx,current)
      await tx`UPDATE tracker_challenges SET state=jsonb_set(jsonb_set(state,'{raceTasksCreated}','true'),'{revision}',to_jsonb((state->>'revision')::int+1)) WHERE id=${row.id}`
    })
  }
  const eligibleDays = Math.min(s.durationDays, Math.max(0, s.durationDays + 1 + Math.floor((Date.now()/1000 - s.expiresAt!) / 86400)))
  const ids = Array.from({length:eligibleDays}, (_,i) => `challenge-${s.id}-${i+1}`)
  const rows = await getDb()`SELECT user_id, count(*)::int AS days FROM habit_todos
    WHERE user_id IN (${row.creator_id}, ${row.player_id}) AND id = ANY(${ids}::text[]) AND status='completed' GROUP BY user_id`
  const count = (owner: number | null) => Number(rows.find(r => r.user_id === owner)?.days ?? 0)
  return { creator: count(row.creator_id), player: row.player_id === null ? (s.guestDays?.length ?? 0) : count(row.player_id) }
}
