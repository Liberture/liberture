import type { SeedHabitBlueprint } from "./types"

/**
 * Schedule shorthands for authoring blueprints.
 *
 * Lifted out of catalog.ts so every pillar module can use the same vocabulary.
 */

type Schedule = SeedHabitBlueprint["schedule"]

export const daily: Schedule = { type: "daily" }

export const weekdays: Schedule = { type: "specific_days", days: [1, 2, 3, 4, 5] }

/** `on(1, 4)` — Monday and Thursday. 0 = Sunday. */
export const on = (...days: number[]): Schedule => ({ type: "specific_days", days })

/** For protocols that specify a frequency rather than particular days. */
export const timesPerWeek = (n: number): Schedule => ({ type: "times_per_week", timesPerWeek: n })
