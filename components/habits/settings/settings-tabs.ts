export type SettingsTab = "profile" | "preferences" | "reminders" | "assistants" | "developer" | "data"

export const SETTINGS_TABS: readonly SettingsTab[] = ["profile", "preferences", "reminders", "assistants", "developer", "data"]

/** Ids an older build may have left in localStorage, mapped to their new home. */
const LEGACY_TABS: Record<string, SettingsTab> = { account: "profile" }

export function toSettingsTab(value: string | null | undefined): SettingsTab | null {
  if (!value) return null
  if ((SETTINGS_TABS as readonly string[]).includes(value)) return value as SettingsTab
  return LEGACY_TABS[value] ?? null
}
