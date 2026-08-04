import { EMPTY_STATE, TRACKER_SCHEMA_VERSION, type TrackerState } from "./types"

export const STORAGE_KEY = "liberture.tracker.v1"

/**
 * localStorage-backed persistence. No account, no network — everything the
 * tracker knows lives in this browser until the user exports it.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

/** Brings older payloads up to the current schema. Only v1 exists so far. */
function migrate(raw: TrackerState): TrackerState {
  let state = raw
  if (typeof state.version !== "number") {
    state = { ...state, version: TRACKER_SCHEMA_VERSION }
  }
  return { ...EMPTY_STATE, ...state, version: TRACKER_SCHEMA_VERSION }
}

export function loadState(): TrackerState {
  if (!isBrowser()) return EMPTY_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw) as TrackerState
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE
    return migrate(parsed)
  } catch (error) {
    // Corrupt payload shouldn't hard-fail the app — start clean instead.
    console.error("tracker: failed to read saved state", error)
    return EMPTY_STATE
  }
}

export function saveState(state: TrackerState): void {
  if (!isBrowser()) return
  try {
    const payload: TrackerState = { ...state, updatedAt: new Date().toISOString() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    // Quota or private-mode failures are non-fatal; the session keeps working in memory.
    console.error("tracker: failed to save state", error)
  }
}

export function clearState(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("tracker: failed to clear state", error)
  }
}

export function exportState(state: TrackerState): string {
  return JSON.stringify(state, null, 2)
}

/** Parses a previously exported payload. Returns null when it isn't usable. */
export function importState(json: string): TrackerState | null {
  try {
    const parsed = JSON.parse(json) as TrackerState
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.habits)) return null
    return migrate(parsed)
  } catch {
    return null
  }
}
