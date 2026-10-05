import { exerciseProtocols } from "./exercise"
import { financeProtocols } from "./finance"
import { mindProtocols } from "./mind"
import { nutritionProtocols } from "./nutrition"
import { sleepProtocols } from "./sleep"
import type { SeedProtocol } from "./types"
import { workProtocols } from "./work"

/**
 * The protocol library.
 *
 * Split into one module per pillar. The flat file this replaced was already 540
 * lines for twelve protocols; the same shape at this size would be unreadable
 * and unmergeable.
 *
 * Consumed by lib/protocols/catalog.ts, which turns these into catalog entries.
 * `catalog.ts` imports from "./library", which resolves here — the split is
 * invisible to every consumer.
 */

export type { SeedProtocol, SeedHabitBlueprint } from "./types"
export { daily, on, timesPerWeek, weekdays } from "./schedule"

export const protocols: SeedProtocol[] = [
  ...workProtocols,
  ...sleepProtocols,
  ...nutritionProtocols,
  ...mindProtocols,
  ...exerciseProtocols,
  ...financeProtocols,
]
