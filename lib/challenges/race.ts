import { getDb } from "@/lib/habits/db"
import { formatDateInTimeZone } from "@/lib/habits/date-utils"
import { getCompletionRow, refreshStorageJsonFromOptimizedTables, syncOptimizedStorageTablesIfEmpty, upsertCompletionRow, upsertTodoRow } from "@/lib/habits/optimized-storage"
import type { Habit, StorageData, Todo } from "@/lib/habits/types"
import { fail, stageOf, type ChallengeRow } from "./server"
import type { ChallengeTracking, Player, RaceProgress, Role } from "./types"

type Sql = ReturnType<typeof getDb>
const habitIdFor = (id: string) => `challenge-${id}`

export function challengeDates(expiresAt: number, days: number, timeZone = "UTC") {
  const first = formatDateInTimeZone(new Date((expiresAt - days * 86400) * 1000), timeZone)
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(first + "T00:00:00Z")
    date.setUTCDate(date.getUTCDate() + index)
    return date.toISOString().slice(0, 10)
  })
}

// Called inside the challenge transaction. User locks keep storage saves and
// legacy-task conversion atomic, including completion history and tombstones.
export async function createRaceTasks(tx: Sql, row: ChallengeRow) {
  const s = row.state
  if (!s.expiresAt) return
  const now = new Date().toISOString()
  for (const owner of [row.creator_id, row.player_id].filter((id): id is number => id !== null).sort((a,b) => a-b)) {
    const [user] = await tx`SELECT data FROM habit_users WHERE id=${owner} FOR UPDATE`
    const data: StorageData = user.data ?? {}
    await syncOptimizedStorageTablesIfEmpty(tx, owner, data)
    const legacy = await tx`SELECT body FROM habit_todos WHERE user_id=${owner} AND body->>'challengeId'=${s.id}`
    const originalFirst = legacy.find(({ body }) => body.challengeDay === 1)?.body.dueDate
    const dates = originalFirst ? challengeDatesFromStart(originalFirst, s.durationDays) : challengeDates(s.expiresAt, s.durationDays, data.preferences?.timeZone ?? "UTC")
    if (s.durationDays === 1) {
      // Existing one-off tasks must keep their completion state.
      const [existing] = await tx`SELECT id FROM habit_todos WHERE user_id=${owner} AND id=${`challenge-${s.id}-1`}`
      if (!existing) await upsertTodoRow(tx, owner, {
        id: `challenge-${s.id}-1`, challengeId: s.id, challengeDay: 1, title: s.title,
        description: s.rules, dueDate: dates[0], priority: 3,
        status: "incomplete", createdAt: now, updatedAt: now,
      })
      await refreshStorageJsonFromOptimizedTables(tx, owner, ["todos"], now)
      continue
    }
    const habitId = habitIdFor(s.id)
    const habits = data.habits ?? []
    if (!habits.some(habit => habit.id === habitId)) {
      const habit: Habit = {
        id: habitId, name: s.title, description: s.rules, time: "00:00", timeOfDay: "anytime",
        color: "#8B5CF6", category: "personal", schedule: { type: "daily" },
        createdAt: now, updatedAt: now, startDate: dates[0],
        challenge: { id: s.id, startDate: dates[0], endDate: dates[dates.length - 1] },
      }
      habits.push(habit)
    }
    const tombstones = { ...(data.todoTombstones ?? {}) }
    for (const { body } of legacy) {
      const todo = body as Todo
      const date = dates[(todo.challengeDay ?? 0) - 1]
      if (date && (todo.status === "completed" || todo.notes) && !await getCompletionRow(tx, owner, habitId, date)) {
        await upsertCompletionRow(tx, owner, {
          habitId, date, completed: todo.status === "completed",
          completedAt: todo.completedAt ?? todo.updatedAt ?? now,
          ...(todo.notes && { context: todo.notes }),
        })
      }
      tombstones[todo.id] = now
    }
    await tx`DELETE FROM habit_todos WHERE user_id=${owner} AND body->>'challengeId'=${s.id}`
    await tx`UPDATE habit_users SET data=jsonb_set(jsonb_set(COALESCE(data,'{}'::jsonb),'{habits}',${JSON.stringify(habits)}::jsonb),'{todoTombstones}',${JSON.stringify(tombstones)}::jsonb), updated_at=NOW() WHERE id=${owner}`
    await refreshStorageJsonFromOptimizedTables(tx, owner, ["todos", "completions"], now)
  }
}

async function ensureRaceTracking(row: ChallengeRow) {
  if (!row.state.deposits.creator || !row.state.deposits.player || row.state.raceTrackingVersion === 2) return
  await getDb().begin(async tx => {
    const [current] = await tx<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE id=${row.id} FOR UPDATE`
    if (current.state.raceTrackingVersion !== 2) {
      await createRaceTasks(tx, current)
      current.state.raceTasksCreated = true
      current.state.raceTrackingVersion = 2
      current.state.revision++
      await tx`UPDATE tracker_challenges SET state=${JSON.stringify(current.state)}::jsonb WHERE id=${row.id}`
    }
    row.state = current.state
  })
}

async function trackingFor(row: ChallengeRow, side: Player): Promise<ChallengeTracking> {
  const s = row.state
  const owner = side === "creator" ? row.creator_id : row.player_id
  const [user] = owner === null ? [] : await getDb()`SELECT data FROM habit_users WHERE id=${owner}`
  const data = user?.data as StorageData | undefined
  const habit = data?.habits?.find(h => h.id === habitIdFor(s.id))
  const dates = habit?.challenge
    ? challengeDatesFromStart(habit.challenge.startDate, s.durationDays)
    : challengeDates(s.expiresAt!, s.durationDays, data?.preferences?.timeZone ?? "UTC")
  const today = formatDateInTimeZone(new Date(), data?.preferences?.timeZone ?? "UTC")
  const completed = new Set<string>()
  if (owner === null) {
    for (const day of s.guestDays ?? []) if (dates[day - 1]) completed.add(dates[day - 1])
  } else if (s.durationDays > 1) {
    const rows = await getDb()`SELECT date::text FROM habit_completions WHERE user_id=${owner} AND habit_id=${habitIdFor(s.id)} AND completed=true AND date >= ${dates[0]}::date AND date <= ${dates[dates.length - 1]}::date`
    for (const record of rows) completed.add(record.date)
  } else {
    const [todo] = await getDb()`SELECT status FROM habit_todos WHERE user_id=${owner} AND id=${`challenge-${s.id}-1`}`
    if (todo?.status === "completed") completed.add(dates[0])
  }
  return {
    kind: s.durationDays > 1 ? "habit" : "todo",
    days: dates.map((date, index) => ({ day: index + 1, date, completed: date <= today && completed.has(date), available: date <= today && stageOf(s) === "active" })),
  }
}

function challengeDatesFromStart(first: string, days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(first + "T00:00:00Z")
    date.setUTCDate(date.getUTCDate() + index)
    return date.toISOString().slice(0, 10)
  })
}

export async function raceProgress(row: ChallengeRow): Promise<RaceProgress | undefined> {
  if (!row.state.deposits.creator || !row.state.deposits.player) return
  await ensureRaceTracking(row)
  const [creator, player] = await Promise.all([trackingFor(row, "creator"), trackingFor(row, "player")])
  return { creator: creator.days.filter(d => d.completed).length, player: player.days.filter(d => d.completed).length }
}

export async function raceTracking(row: ChallengeRow, role: Role): Promise<ChallengeTracking | undefined> {
  if (role === "moderator" || !row.state.deposits.creator || !row.state.deposits.player) return
  await ensureRaceTracking(row)
  return trackingFor(row, role)
}

export async function completeRaceDay(id: string, role: Role, day: number, complete: boolean) {
  if (role === "moderator") fail("forbidden", 403)
  const [initial] = await getDb()<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE id=${id}`
  await ensureRaceTracking(initial)
  return getDb().begin(async tx => {
    const [row] = await tx<ChallengeRow[]>`SELECT * FROM tracker_challenges WHERE id=${id} FOR UPDATE`
    const s = row.state
    if (stageOf(s) !== "active" || !Number.isInteger(day) || day < 1 || day > s.durationDays) fail("stateChanged")
    const owner = role === "creator" ? row.creator_id : row.player_id
    const [user] = owner === null ? [] : await tx`SELECT data FROM habit_users WHERE id=${owner} FOR UPDATE`
    const data = user?.data as StorageData | undefined
    const habit = data?.habits?.find(h => h.id === habitIdFor(id))
    const dates = habit?.challenge ? challengeDatesFromStart(habit.challenge.startDate, s.durationDays) : challengeDates(s.expiresAt!, s.durationDays, data?.preferences?.timeZone ?? "UTC")
    const date = dates[day - 1]
    if (date > formatDateInTimeZone(new Date(), data?.preferences?.timeZone ?? "UTC")) fail("stateChanged")
    const now = new Date().toISOString()
    if (owner === null) {
      const days = new Set(s.guestDays)
      if (complete) days.add(day)
      else days.delete(day)
      s.guestDays = [...days]
    } else if (s.durationDays > 1) {
      const previous = await getCompletionRow(tx, owner, habitIdFor(id), date)
      await upsertCompletionRow(tx, owner, { ...previous, habitId: habitIdFor(id), date, completed: complete, completedAt: now })
      await refreshStorageJsonFromOptimizedTables(tx, owner, ["completions"], now)
    } else {
      const [existing] = await tx`SELECT body FROM habit_todos WHERE user_id=${owner} AND id=${`challenge-${id}-1`}`
      if (!existing) fail("stateChanged")
      await upsertTodoRow(tx, owner, { ...existing.body, status: complete ? "completed" : "incomplete", completedAt: complete ? now : undefined, updatedAt: now })
      await refreshStorageJsonFromOptimizedTables(tx, owner, ["todos"], now)
    }
    s.revision++
    await tx`UPDATE tracker_challenges SET state=${JSON.stringify(s)}::jsonb WHERE id=${id}`
    return row
  })
}
