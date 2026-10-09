import { normalizeName } from "@/lib/habits/api/resolve"
import type { DataEntryField, Habit } from "@/lib/habits/types"

/**
 * Which data-entry field each spoken value goes to: `values` keyed by the
 * field's label, unit or id; a single `value` to the field whose unit
 * matches `unit`, else the first number field. Habits that don't track a
 * number keep it under "value", so nothing the user said is dropped.
 */
export function valuesForHabit(
  habit: Habit,
  input: { value?: unknown; values?: unknown; unit?: unknown }
): { data: Record<string, number | string>; fields: DataEntryField[] } | { error: string } {
  const fields = habit.dataEntry?.enabled ? habit.dataEntry.fields : []
  const numberFields = fields.filter((f) => f.type === "number")
  const data: Record<string, number | string> = {}
  const used: DataEntryField[] = []

  const fieldFor = (key: string) => {
    const k = normalizeName(key)
    return fields.find((f) => f.id === key || normalizeName(f.label) === k || (f.unit && normalizeName(f.unit) === k))
  }

  if (input.values && typeof input.values === "object" && !Array.isArray(input.values)) {
    for (const [key, raw] of Object.entries(input.values as Record<string, unknown>)) {
      const field = fieldFor(key)
      const value = field?.type === "text" ? String(raw) : Number(raw)
      if (typeof value === "number" && !Number.isFinite(value)) return { error: `${key} must be a number` }
      data[field?.id ?? key] = value
      if (field) used.push(field)
    }
  }
  if (input.value !== undefined && input.value !== null && input.value !== "") {
    const value = Number(input.value)
    if (!Number.isFinite(value)) return { error: "value must be a number" }
    const field = (typeof input.unit === "string" && fieldFor(input.unit)) || numberFields[0]
    data[field?.id ?? "value"] = value
    if (field) used.push(field)
  }
  return { data, fields: used }
}
