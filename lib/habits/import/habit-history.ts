import { normalizeName, resolveByName } from "@/lib/habits/api/resolve"
import type { DataEntryField, Habit, HabitCompletion } from "@/lib/habits/types"

/**
 * Bulk import of completion history from an older habit tracker's backup
 * (the same StorageData shape Liberture exports) into an account that already
 * has data. Pure: parsing, habit and field matching, and the per-record plan.
 * run-habit-history-import.ts does the reads and writes.
 *
 * Nothing here ever overwrites or removes what the account already has: a day
 * that already has a record keeps it (conflictPolicy decides whether missing
 * values may be added to it), and `completed: false` in a backup is never an
 * instruction to un-mark a day.
 */

export const MAX_IMPORT_RECORDS = 50_000
export const DEFAULT_BATCH_SIZE = 500
export const MAX_BATCH_SIZE = 2_000

export type ConflictPolicy = "preserve_existing" | "merge_values"
export const CONFLICT_POLICIES: readonly ConflictPolicy[] = ["preserve_existing", "merge_values"]

/** Where an import came from, kept on every row it writes. */
export const IMPORT_SOURCE = "habit_history_import"

export type CompletionValue = number | string

export interface BackupHabit {
  id: string
  name: string
  archived: boolean
  fields: DataEntryField[]
}

/** One record of the backup's completions array, validated. */
export interface BackupRecord {
  /** Position in the backup's completions array; the record's id in reports. */
  index: number
  habitId: string
  date: string
  completed: boolean
  completedAt?: string
  data: Record<string, CompletionValue>
  /** context, energyLevel, difficulty, emotionalBenefits… kept as they are. */
  extra: Record<string, unknown>
}

export interface RecordFailure {
  index: number
  habitId?: string
  date?: string
  error: string
}

export interface ParsedBackup {
  habits: BackupHabit[]
  records: BackupRecord[]
  failures: RecordFailure[]
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const KNOWN_KEYS = new Set(["habitId", "date", "completed", "completedAt", "data"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

/** A real calendar day, not just the right shape (no 2026-02-30). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false
  const [y, m, d] = value.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function parseHabit(raw: unknown): BackupHabit | null {
  if (!isRecord(raw)) return null
  const id = typeof raw.id === "string" || typeof raw.id === "number" ? String(raw.id) : ""
  if (!id) return null
  const dataEntry = isRecord(raw.dataEntry) ? raw.dataEntry : null
  const fields = Array.isArray(dataEntry?.fields)
    ? ((dataEntry as Record<string, unknown>).fields as unknown[]).filter(
        (f): f is DataEntryField => isRecord(f) && typeof f.id === "string" && (f.type === "number" || f.type === "text")
      )
    : []
  return { id, name: typeof raw.name === "string" ? raw.name : "", archived: raw.archived === true, fields }
}

function parseRecord(raw: unknown, index: number): BackupRecord | RecordFailure {
  if (!isRecord(raw)) return { index, error: "not an object" }
  const habitId = typeof raw.habitId === "string" || typeof raw.habitId === "number" ? String(raw.habitId).trim() : ""
  const date = typeof raw.date === "string" ? raw.date : undefined
  if (!habitId) return { index, date, error: "habitId is missing" }
  if (!isCalendarDate(date)) return { index, habitId, date, error: "date must be a calendar day, YYYY-MM-DD" }
  if (raw.completed !== undefined && typeof raw.completed !== "boolean") {
    return { index, habitId, date, error: "completed must be true or false" }
  }
  let completedAt: string | undefined
  if (raw.completedAt !== undefined && raw.completedAt !== null && raw.completedAt !== "") {
    if (typeof raw.completedAt !== "string" || Number.isNaN(Date.parse(raw.completedAt))) {
      return { index, habitId, date, error: "completedAt must be an ISO timestamp" }
    }
    completedAt = raw.completedAt
  }
  const data: Record<string, CompletionValue> = {}
  if (raw.data !== undefined && raw.data !== null) {
    if (!isRecord(raw.data)) return { index, habitId, date, error: "data must be an object" }
    for (const [key, value] of Object.entries(raw.data)) {
      if (typeof value === "number" && Number.isFinite(value)) data[key] = value
      else if (typeof value === "string") data[key] = value
      else return { index, habitId, date, error: `data.${key} must be a number or text` }
    }
  }
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) if (!KNOWN_KEYS.has(key) && value !== undefined) extra[key] = value
  // A record without the flag counts as not done, as the per-row tables have always read it.
  return { index, habitId, date, completed: raw.completed === true, ...(completedAt ? { completedAt } : {}), data, extra }
}

/**
 * Accepts a full backup ({ habits, completions, … }), the same as a JSON
 * string, or a bare completions array. Invalid records are reported, never
 * dropped silently; only a payload that isn't a backup at all is an error.
 */
export function parseHabitHistoryBackup(input: unknown): ParsedBackup | { error: string } {
  let payload = input
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload)
    } catch {
      return { error: "data is not valid JSON" }
    }
  }
  const completions = Array.isArray(payload) ? payload : isRecord(payload) ? payload.completions : undefined
  if (!Array.isArray(completions)) return { error: "data must be a backup with a completions array" }
  if (completions.length > MAX_IMPORT_RECORDS) {
    return { error: `A backup can hold at most ${MAX_IMPORT_RECORDS} completions; this one has ${completions.length}` }
  }
  const rawHabits = isRecord(payload) && Array.isArray(payload.habits) ? payload.habits : []
  const habits = rawHabits.map(parseHabit).filter((h): h is BackupHabit => h !== null)

  const records: BackupRecord[] = []
  const failures: RecordFailure[] = []
  completions.forEach((raw, index) => {
    const parsed = parseRecord(raw, index)
    if ("error" in parsed) failures.push(parsed)
    else records.push(parsed)
  })
  return { habits, records, failures }
}

// ---------------------------------------------------------------- habit matching

/** How an old habit was matched, strongest first. */
export type MatchMethod = "explicit" | "same_id" | "previous_import" | "exact_name" | "normalized_name" | "similar_name"

export interface MatchCandidate {
  habitId: string
  name: string
  score: number
}

export interface HabitMatch {
  oldHabitId: string
  /** null when the backup's habit list doesn't have this id. */
  oldName: string | null
  newHabitId: string | null
  newName: string | null
  status: "mapped" | "ambiguous" | "unmatched"
  method?: MatchMethod
  /** 0-1, for name matches. */
  confidence?: number
  /** Possible matches to confirm through habitMapping (ambiguous ones). */
  candidates?: MatchCandidate[]
  /** Why it isn't mapped. */
  reason?: string
  /** Backup records for this habit. */
  records: number
}

/** One habitMapping entry: the old id, the new habit (id or exact name), optional field ids. */
export interface MappingInput {
  oldHabitId: string
  newHabitId: string | null
  fields?: Record<string, string>
}

/**
 * habitMapping as { "oldId": "newId" } or [{ oldHabitId, newHabitId, fields }].
 * A null newHabitId keeps that habit's records pending on purpose.
 */
export function parseHabitMapping(input: unknown): MappingInput[] | { error: string } {
  if (input === undefined || input === null) return []
  if (Array.isArray(input)) {
    const result: MappingInput[] = []
    for (const entry of input) {
      if (!isRecord(entry)) return { error: "habitMapping entries must be objects" }
      const oldHabitId = typeof entry.oldHabitId === "string" || typeof entry.oldHabitId === "number" ? String(entry.oldHabitId) : ""
      if (!oldHabitId) return { error: "every habitMapping entry needs oldHabitId" }
      const newHabitId = typeof entry.newHabitId === "string" && entry.newHabitId.trim() ? entry.newHabitId.trim() : null
      let fields: Record<string, string> | undefined
      if (entry.fields !== undefined) {
        if (!isRecord(entry.fields) || Object.values(entry.fields).some((v) => typeof v !== "string")) {
          return { error: `habitMapping fields for ${oldHabitId} must map old field ids to new field ids` }
        }
        fields = entry.fields as Record<string, string>
      }
      result.push({ oldHabitId, newHabitId, ...(fields ? { fields } : {}) })
    }
    return result
  }
  if (isRecord(input)) {
    const result: MappingInput[] = []
    for (const [oldHabitId, value] of Object.entries(input)) {
      if (value !== null && typeof value !== "string") return { error: `habitMapping.${oldHabitId} must be a habit id, a name or null` }
      result.push({ oldHabitId, newHabitId: typeof value === "string" && value.trim() ? value.trim() : null })
    }
    return result
  }
  return { error: "habitMapping must be an object or an array" }
}

/** Words that say nothing about which habit it is. */
const NAME_STOPWORDS = new Set([
  "of", "the", "and", "a", "an", "in", "on", "for", "to", "my", "with", "x",
  "de", "del", "la", "el", "los", "las", "y", "en", "con", "para", "mi", "mis", "al",
])

/** Spellings of the same unit in a habit's name ("10m", "10 minutes"). */
const NAME_UNITS: Record<string, string> = {
  m: "min", min: "min", mins: "min", minute: "min", minutes: "min", minuto: "min", minutos: "min",
  h: "h", hr: "h", hrs: "h", hour: "h", hours: "h", hora: "h", horas: "h",
  s: "s", sec: "s", secs: "s", second: "s", seconds: "s", segundos: "s",
  k: "km", km: "km", kms: "km", kilometers: "km", kilometres: "km",
}

function stemWord(word: string): string {
  if (/^\d+$/.test(word) || word.length <= 3) return word
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`
  if (/(ss|us|is)$/.test(word)) return word
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2)
  if (word.endsWith("s")) return word.slice(0, -1)
  return word
}

/** "25Pull Ups" → ["25", "pull", "up"]; "10m Mindfulness" → ["10", "min", "mindfulness"]. */
export function nameTokens(name: string): string[] {
  return normalizeName(name)
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((w) => NAME_UNITS[w] ?? w)
    .filter((w) => !NAME_STOPWORDS.has(w))
    .map(stemWord)
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return prev[b.length]
}

/** Same word, allowing a typo in a long one ("nightime" ~ "nighttime"). Numbers must be equal. */
function sameWord(a: string, b: string): boolean {
  if (a === b) return true
  if (/\d/.test(a) || /\d/.test(b)) return false
  const shorter = Math.min(a.length, b.length)
  if (shorter < 5) return false
  return editDistance(a, b) <= (shorter >= 9 ? 2 : 1)
}

export interface NameSimilarity {
  /** 1 for the same name once normalized; less for a looser match. */
  score: number
  /** Strong enough to map without asking. */
  confident: boolean
  method: "exact_name" | "normalized_name" | "similar_name"
}

/**
 * How alike two habit names are, or null when not at all. Confident when the
 * names are the same once spacing, plurals and unit spellings are evened out,
 * or when every word of the shorter name (at least two) is in the longer one
 * and the numbers agree: "Nightime Journal and Reflection of Habits 1B1" →
 * "Nighttime Journal and Reflection". "4x30 Push Ups" and "4x10 Push Ups" are
 * only candidates: the counts differ.
 */
export function nameSimilarity(oldName: string, newName: string): NameSimilarity | null {
  if (!oldName.trim() || !newName.trim()) return null
  if (normalizeName(oldName) === normalizeName(newName)) return { score: 1, confident: true, method: "exact_name" }
  const a = nameTokens(oldName)
  const b = nameTokens(newName)
  if (!a.length || !b.length) return null
  if (a.join("") === b.join("")) return { score: 0.98, confident: true, method: "normalized_name" }

  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  const used = new Set<number>()
  let matched = 0
  for (const word of short) {
    const at = long.findIndex((other, i) => !used.has(i) && sameWord(word, other))
    if (at >= 0) {
      used.add(at)
      matched++
    }
  }
  if (!matched) return null
  const numbersA = a.filter((w) => /^\d+$/.test(w)).sort().join(",")
  const numbersB = b.filter((w) => /^\d+$/.test(w)).sort().join(",")
  const numbersAgree = !numbersA || !numbersB || numbersA === numbersB
  const containment = matched / short.length
  const dice = (2 * matched) / (a.length + b.length)
  const confident = numbersAgree && containment === 1 && short.filter((w) => !/^\d+$/.test(w)).length >= 2
  const score = Math.round((confident ? 0.85 + 0.1 * dice : Math.max(dice, containment * 0.8) * (numbersAgree ? 1 : 0.7)) * 100) / 100
  if (!confident && score < 0.5) return null
  return { score, confident, method: "similar_name" }
}

const METHOD_RANK: Record<MatchMethod, number> = {
  explicit: 6, same_id: 5, previous_import: 4, exact_name: 3, normalized_name: 2, similar_name: 1,
}

/**
 * The old → new habit map. Explicit entries, the same id and ids recorded by
 * an earlier import (Habit.importedIds) are taken as they are; names are
 * matched only when exactly one current habit fits confidently and no other
 * old habit claims it. Everything else is ambiguous (with candidates) or
 * unmatched, and its records stay pending — never guessed.
 */
export function buildHabitMapping(
  backupHabits: BackupHabit[],
  records: BackupRecord[],
  currentHabits: Habit[],
  explicit: MappingInput[]
): { matches: HabitMatch[]; errors: string[] } {
  const errors: string[] = []
  const names = new Map(backupHabits.map((h) => [h.id, h.name]))
  const counts = new Map<string, number>()
  for (const r of records) counts.set(r.habitId, (counts.get(r.habitId) ?? 0) + 1)
  const oldIds = [...new Set([...backupHabits.map((h) => h.id), ...records.map((r) => r.habitId)])]
  const byId = new Map(currentHabits.map((h) => [h.id, h]))
  const explicitById = new Map(explicit.map((e) => [e.oldHabitId, e]))
  for (const entry of explicit) {
    if (!oldIds.includes(entry.oldHabitId)) errors.push(`habitMapping: ${entry.oldHabitId} is not in this backup`)
  }

  const matches: HabitMatch[] = oldIds.map((oldHabitId) => {
    const oldName = names.get(oldHabitId) ?? null
    const base = { oldHabitId, oldName, records: counts.get(oldHabitId) ?? 0 }
    const mapped = (habit: Habit, method: MatchMethod, confidence?: number): HabitMatch => ({
      ...base, newHabitId: habit.id, newName: habit.name, status: "mapped", method, ...(confidence !== undefined ? { confidence } : {}),
    })

    const entry = explicitById.get(oldHabitId)
    if (entry) {
      if (entry.newHabitId === null) {
        return { ...base, newHabitId: null, newName: null, status: "unmatched", method: "explicit", reason: "kept pending by habitMapping" }
      }
      const resolved = resolveByName(currentHabits, entry.newHabitId, (h) => h.name)
      if (resolved.kind === "match") return mapped(resolved.item, "explicit")
      errors.push(`habitMapping: no single habit matches "${entry.newHabitId}" for ${oldHabitId}`)
      return { ...base, newHabitId: null, newName: null, status: "unmatched", reason: `habitMapping target "${entry.newHabitId}" not found` }
    }

    const same = byId.get(oldHabitId)
    if (same) return mapped(same, "same_id")
    const earlier = currentHabits.find((h) => h.importedIds?.includes(oldHabitId))
    if (earlier) return mapped(earlier, "previous_import")

    if (!oldName) {
      return { ...base, newHabitId: null, newName: null, status: "unmatched", reason: "this habit id is not in the backup's habit list, so there is no name to match" }
    }
    const scored = currentHabits
      .map((h) => ({ habit: h, sim: nameSimilarity(oldName, h.name) }))
      .filter((s): s is { habit: Habit; sim: NameSimilarity } => s.sim !== null)
      .sort((x, y) => y.sim.score - x.sim.score)
    const candidates = scored.slice(0, 5).map((s) => ({ habitId: s.habit.id, name: s.habit.name, score: s.sim.score }))
    const confident = scored.filter((s) => s.sim.confident)
    const best = confident[0]
    if (best && (confident.length === 1 || confident[1].sim.score < best.sim.score)) {
      return mapped(best.habit, best.sim.method, best.sim.score)
    }
    if (candidates.length) {
      return {
        ...base, newHabitId: null, newName: null, status: "ambiguous", candidates,
        reason: confident.length > 1 ? "more than one habit has this name" : "similar names only; confirm with habitMapping",
      }
    }
    return { ...base, newHabitId: null, newName: null, status: "unmatched", reason: "no habit with a similar name" }
  })

  // Two old habits matched by name to the same new one: neither is certain.
  const claims = new Map<string, HabitMatch[]>()
  for (const m of matches) if (m.status === "mapped" && m.newHabitId) claims.set(m.newHabitId, [...(claims.get(m.newHabitId) ?? []), m])
  for (const group of claims.values()) {
    if (group.length < 2) continue
    const top = Math.max(...group.map((m) => METHOD_RANK[m.method!]))
    const winners = group.filter((m) => METHOD_RANK[m.method!] === top)
    for (const m of group) {
      const nameMatch = METHOD_RANK[m.method!] <= METHOD_RANK.exact_name
      const keep = !nameMatch || (winners.length === 1 && winners[0] === m)
      if (keep) continue
      const target = { habitId: m.newHabitId!, name: m.newName!, score: m.confidence ?? 0 }
      Object.assign(m, {
        status: "ambiguous", newHabitId: null, newName: null, method: undefined, confidence: undefined,
        candidates: [target], reason: "another habit in the backup matches the same habit; confirm with habitMapping",
      })
    }
  }
  return { matches, errors }
}

// ---------------------------------------------------------------- field matching

/** Spellings of a field's unit. */
const FIELD_UNITS: Record<string, string> = {
  min: "min", mins: "min", minute: "min", minutes: "min", minuto: "min", minutos: "min",
  h: "h", hr: "h", hrs: "h", hour: "h", hours: "h", hora: "h", horas: "h",
  s: "s", sec: "s", secs: "s", seconds: "s", segundos: "s",
  km: "km", m: "m", meters: "m", metres: "m", metros: "m",
  kg: "kg", g: "g", grams: "g", gramos: "g", l: "l", liters: "l", litros: "l", ml: "ml",
  c: "c", "°c": "c", celsius: "c",
}
const UNIT_FACTORS: Record<string, Record<string, number>> = {
  min: { h: 1 / 60, s: 60 }, h: { min: 60, s: 3600 }, s: { min: 1 / 60, h: 1 / 3600 },
  km: { m: 1000 }, m: { km: 0.001 }, kg: { g: 1000 }, g: { kg: 0.001 }, l: { ml: 1000 }, ml: { l: 0.001 },
}

function unitKey(unit: string | undefined): string | null {
  if (!unit?.trim()) return null
  const key = unit.trim().toLowerCase()
  return FIELD_UNITS[key] ?? normalizeName(key)
}

/** Multiplier from one unit to the other: 1 when either is unknown, null when they can't be converted. */
export function unitFactor(from: string | undefined, to: string | undefined): number | null {
  const a = unitKey(from)
  const b = unitKey(to)
  if (!a || !b || a === b) return 1
  return UNIT_FACTORS[a]?.[b] ?? null
}

export interface FieldTarget {
  fieldId: string
  /** Old value × factor = new value (unit conversion). */
  factor: number
}

/**
 * Where each value key of an old habit's records goes in the new habit: the
 * same field id, the same label or unit, or — one number field on each side —
 * that field. Units are converted (minutes → hours); keys with no home are
 * left out of the map and kept under their old id, so no value is lost.
 */
export function buildFieldMap(
  keys: string[],
  oldFields: DataEntryField[],
  newHabit: Habit,
  explicit: Record<string, string> = {}
): Record<string, FieldTarget> {
  const newFields = newHabit.dataEntry?.fields ?? []
  const oldNumbers = oldFields.filter((f) => f.type === "number")
  const newNumbers = newFields.filter((f) => f.type === "number")
  const map: Record<string, FieldTarget> = {}
  const taken = new Set<string>()
  const assign = (key: string, field: DataEntryField, from: DataEntryField | undefined) => {
    const factor = field.type === "number" && from?.type !== "text" ? unitFactor(from?.unit, field.unit) : 1
    if (factor === null) return false
    map[key] = { fieldId: field.id, factor }
    taken.add(field.id)
    return true
  }

  for (const key of keys) {
    const target = explicit[key] && newFields.find((f) => f.id === explicit[key])
    if (target) assign(key, target, oldFields.find((f) => f.id === key))
  }
  for (const key of keys) {
    if (map[key]) continue
    const old = oldFields.find((f) => f.id === key)
    const free = newFields.filter((f) => !taken.has(f.id) && (!old || f.type === old.type))
    const same =
      free.find((f) => f.id === key) ??
      (old ? free.find((f) => normalizeName(f.label) === normalizeName(old.label)) : undefined) ??
      (old?.unit ? free.find((f) => f.unit && unitKey(f.unit) === unitKey(old.unit)) : undefined) ??
      (key === "value" || (old?.type === "number" && oldNumbers.length === 1)
        ? newNumbers.length === 1 && !taken.has(newNumbers[0].id) ? newNumbers[0] : undefined
        : undefined)
    if (same) assign(key, same, old)
  }
  return map
}

export function mapValues(
  data: Record<string, CompletionValue>,
  fieldMap: Record<string, FieldTarget>
): { data: Record<string, CompletionValue>; unmapped: string[] } {
  const result: Record<string, CompletionValue> = {}
  const unmapped: string[] = []
  for (const [key, value] of Object.entries(data)) {
    const target = fieldMap[key]
    if (!target) {
      unmapped.push(key)
      if (!(key in result)) result[key] = value
      continue
    }
    result[target.fieldId] = typeof value === "number" && target.factor !== 1 ? Math.round(value * target.factor * 10_000) / 10_000 : value
  }
  return { data: result, unmapped }
}

// ---------------------------------------------------------------- planning

export type PlanAction = "import" | "merge" | "skip" | "conflict" | "unresolved"

export interface PlannedRecord {
  index: number
  oldHabitId: string
  date: string
  action: PlanAction
  newHabitId?: string
  /** The completion to write (import, merge). */
  completion?: HabitCompletion
  /** For merge: the row it replaces, so a change made meanwhile is not overwritten. */
  previous?: HabitCompletion
  reason?: string
  /** Value keys with no field in the new habit (kept under their old id). */
  unmappedFields?: string[]
}

function sameValue(a: unknown, b: unknown): boolean {
  return typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-9 : a === b
}

/** Everything `incoming` says is already in `existing`: importing it would change nothing. */
export function isCoveredBy(incoming: HabitCompletion, existing: HabitCompletion): boolean {
  if (Boolean(incoming.completed) !== Boolean(existing.completed)) return false
  const have = existing.data ?? {}
  for (const [key, value] of Object.entries(incoming.data ?? {})) if (!sameValue(have[key], value)) return false
  const note = incoming.context?.trim()
  return !note || note === existing.context?.trim()
}

/** What the existing record gets from the backup under merge_values: only what it lacks. */
export function mergeIntoExisting(existing: HabitCompletion, incoming: HabitCompletion): HabitCompletion {
  const merged: HabitCompletion = {
    ...incoming,
    ...existing,
    // Fills a day kept open; never un-marks one.
    completed: Boolean(existing.completed) || Boolean(incoming.completed),
    data: { ...(incoming.data ?? {}), ...(existing.data ?? {}) },
  }
  if (!existing.completedAt && incoming.completedAt) merged.completedAt = incoming.completedAt
  if (!existing.context?.trim() && incoming.context) merged.context = incoming.context
  return merged
}

function describeDifference(incoming: HabitCompletion, existing: HabitCompletion): string {
  if (existing.completed && !incoming.completed) return "the backup has this day as not done; Liberture keeps it as done"
  if (!existing.completed && incoming.completed) return "the backup has this day as done; Liberture has it as not done"
  const have = existing.data ?? {}
  const differing = Object.entries(incoming.data ?? {}).filter(([k, v]) => k in have && !sameValue(have[k], v)).map(([k]) => k)
  if (differing.length) return `different values for ${differing.join(", ")}`
  if (Object.keys(incoming.data ?? {}).some((k) => !(k in have))) return "the backup has values this day doesn't"
  return "the backup has a different note"
}

export interface PlanInput {
  records: BackupRecord[]
  matches: HabitMatch[]
  backupHabits: BackupHabit[]
  currentHabits: Habit[]
  explicit: MappingInput[]
  /** Existing rows keyed `${habitId}:${date}`. */
  existing: Map<string, HabitCompletion>
  conflictPolicy: ConflictPolicy
}

export interface ImportPlan {
  planned: PlannedRecord[]
  fieldMaps: Record<string, Record<string, FieldTarget>>
}

/**
 * One decision per valid record, keyed by (habit, date) in this account:
 *   no record that day           → import
 *   already there, nothing new   → skip
 *   already there, different     → conflict (kept as is), or merge of the
 *                                  missing values under merge_values
 *   habit not mapped             → unresolved (kept pending)
 * Several backup records for the same day are reduced to the most complete one.
 */
export function planImport(input: PlanInput): ImportPlan {
  const matchById = new Map(input.matches.map((m) => [m.oldHabitId, m]))
  const oldHabitById = new Map(input.backupHabits.map((h) => [h.id, h]))
  const currentById = new Map(input.currentHabits.map((h) => [h.id, h]))
  const explicitById = new Map(input.explicit.map((e) => [e.oldHabitId, e]))

  const fieldMaps: Record<string, Record<string, FieldTarget>> = {}
  for (const m of input.matches) {
    if (m.status !== "mapped" || !m.newHabitId) continue
    const keys = [...new Set(input.records.filter((r) => r.habitId === m.oldHabitId).flatMap((r) => Object.keys(r.data)))]
    fieldMaps[m.oldHabitId] = buildFieldMap(keys, oldHabitById.get(m.oldHabitId)?.fields ?? [], currentById.get(m.newHabitId)!, explicitById.get(m.oldHabitId)?.fields)
  }

  const planned: PlannedRecord[] = []
  const groups = new Map<string, { record: BackupRecord; completion: HabitCompletion; unmapped: string[] }[]>()
  for (const record of input.records) {
    const match = matchById.get(record.habitId)
    if (!match || match.status !== "mapped" || !match.newHabitId) {
      planned.push({
        index: record.index, oldHabitId: record.habitId, date: record.date, action: "unresolved",
        reason: match?.status === "ambiguous" ? "habit match needs confirmation" : match?.reason ?? "habit not matched",
      })
      continue
    }
    const { data, unmapped } = mapValues(record.data, fieldMaps[record.habitId] ?? {})
    const completion: HabitCompletion = {
      ...(record.extra as Partial<HabitCompletion>),
      habitId: match.newHabitId,
      date: record.date,
      completed: record.completed,
      ...(record.completedAt ? { completedAt: record.completedAt } : {}),
      data,
      importedFrom: { source: IMPORT_SOURCE, habitId: record.habitId },
    }
    const key = `${match.newHabitId}:${record.date}`
    groups.set(key, [...(groups.get(key) ?? []), { record, completion, unmapped }])
  }

  for (const [key, group] of groups) {
    // The most complete first: done over not done, more values, the latest timestamp.
    group.sort(
      (a, b) =>
        Number(b.completion.completed) - Number(a.completion.completed) ||
        Object.keys(b.completion.data ?? {}).length - Object.keys(a.completion.data ?? {}).length ||
        (b.completion.completedAt ?? "").localeCompare(a.completion.completedAt ?? "") ||
        a.record.index - b.record.index
    )
    const [first, ...rest] = group
    const existing = input.existing.get(key)
    const base = {
      index: first.record.index, oldHabitId: first.record.habitId, date: first.record.date, newHabitId: first.completion.habitId,
      ...(first.unmapped.length ? { unmappedFields: first.unmapped } : {}),
    }
    if (!existing) {
      planned.push({ ...base, action: "import", completion: first.completion })
    } else if (isCoveredBy(first.completion, existing)) {
      planned.push({ ...base, action: "skip", reason: "already in Liberture" })
    } else if (input.conflictPolicy === "merge_values") {
      // Differing values stay as they are, so the merge may add nothing at all.
      const merged = mergeIntoExisting(existing, first.completion)
      const adds =
        merged.completed !== Boolean(existing.completed) ||
        Object.keys(merged.data ?? {}).length !== Object.keys(existing.data ?? {}).length ||
        (merged.context ?? "") !== (existing.context ?? "")
      planned.push({
        ...base,
        action: adds ? "merge" : "conflict",
        ...(adds ? { completion: merged, previous: existing } : {}),
        reason: describeDifference(first.completion, existing),
      })
    } else {
      planned.push({ ...base, action: "conflict", reason: describeDifference(first.completion, existing) })
    }
    for (const other of rest) {
      const covered = isCoveredBy(other.completion, first.completion)
      planned.push({
        index: other.record.index, oldHabitId: other.record.habitId, date: other.record.date, newHabitId: other.completion.habitId,
        action: covered ? "skip" : "conflict",
        reason: covered ? "same day appears earlier in the backup" : `the backup has another record for this day (#${first.record.index}) that was used instead`,
      })
    }
  }
  planned.sort((a, b) => a.index - b.index)
  return { planned, fieldMaps }
}
