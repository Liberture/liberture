"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { SettingRow, SettingsCard, SettingsDivider, SettingsSegmented, settingsButtonClass, settingsInputClass } from "@/components/habits/settings/settings-ui"
import { Switch } from "@/components/habits/ui/switch"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/habits/i18n"
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

type Theme = NonNullable<UserPreferences["theme"]>

/**
 * Themes that render correctly today. app/globals.css only defines the dark
 * palette (on :root) and many tracker components hardcode dark surfaces, so
 * light and system would look broken. Add them here once a light palette exists.
 */
const AVAILABLE_THEMES: readonly Theme[] = ["dark"]

interface PreferencesTabProps {
  preferences: UserPreferences
  onPreferencesChange: (patch: Partial<UserPreferences>) => void
}

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

function supportedTimeZones(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    return intl.supportedValuesOf?.("timeZone") ?? []
  } catch {
    return []
  }
}

export function PreferencesTab({ preferences, onPreferencesChange }: PreferencesTabProps) {
  const t = useTranslations().habits.app.settingsDialog.prefs
  const locale = useLocale()
  const router = useRouter()
  const [languagePending, startTransition] = useTransition()
  const { setTheme } = useTheme()
  const [deviceZone, setDeviceZone] = useState<string | null>(null)
  useEffect(() => setDeviceZone(browserTimeZone()), [])

  const prefs = { ...DEFAULT_PREFERENCES, ...preferences }
  const timeZone = preferences.timeZone ?? deviceZone ?? ""
  const zones = useMemo(() => {
    const list = supportedTimeZones()
    // Some engines leave UTC or the device zone out of the list; never show a blank select.
    for (const zone of [timeZone, deviceZone]) if (zone && !list.includes(zone)) list.unshift(zone)
    return list
  }, [timeZone, deviceZone])
  const theme: Theme = AVAILABLE_THEMES.includes(prefs.theme) ? prefs.theme : AVAILABLE_THEMES[0]

  const chooseLanguage = (next: Locale) => {
    if (next === locale) return
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  const chooseTheme = (next: Theme) => {
    setTheme(next)
    onPreferencesChange({ theme: next })
  }

  return (
    <>
      <SettingsCard title={t.languageTitle}>
        <SettingRow
          title={t.language}
          description={t.languageHint}
          action={
            <div className={cn(languagePending && "opacity-60")}>
              <SettingsSegmented
                label={t.language}
                value={locale}
                options={LOCALES.map((l) => ({ value: l, label: t.languageNames[l] }))}
                onChange={chooseLanguage}
                disabled={languagePending}
              />
            </div>
          }
        />
        <SettingsDivider />
        <div className="space-y-1.5">
          <label htmlFor="pref-timezone" className="block text-sm font-medium text-foreground">
            {t.timeZone}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="pref-timezone"
              value={timeZone}
              aria-describedby="pref-timezone-hint"
              onChange={(event) => onPreferencesChange({ timeZone: event.target.value })}
              className={cn(settingsInputClass, "min-w-0 flex-1 sm:max-w-xs")}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {deviceZone && timeZone !== deviceZone ? (
              <button type="button" onClick={() => onPreferencesChange({ timeZone: deviceZone })} className={settingsButtonClass()}>
                {formatMessage(t.useDeviceTimeZone, { zone: deviceZone.replace(/_/g, " ") })}
              </button>
            ) : null}
          </div>
          <p id="pref-timezone-hint" className="text-xs text-muted-foreground">
            {t.timeZoneHint}
          </p>
        </div>
        <SettingsDivider />
        <SettingRow
          title={t.weekStart}
          action={
            <SettingsSegmented
              label={t.weekStart}
              value={String(prefs.weekStartsOn) as "0" | "1"}
              options={[
                { value: "1", label: t.monday },
                { value: "0", label: t.sunday },
              ]}
              onChange={(value) => onPreferencesChange({ weekStartsOn: value === "0" ? 0 : 1 })}
            />
          }
        />
        <SettingRow
          title={t.timeFormat}
          action={
            <SettingsSegmented
              label={t.timeFormat}
              value={prefs.timeFormat}
              options={[
                { value: "24h", label: t.time24h },
                { value: "12h", label: t.time12h },
              ]}
              onChange={(timeFormat) => onPreferencesChange({ timeFormat })}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title={t.appearanceTitle}>
        <SettingRow
          title={t.theme}
          description={AVAILABLE_THEMES.length === 1 ? t.themeOnlyDark : undefined}
          action={
            <SettingsSegmented
              label={t.theme}
              value={theme}
              options={AVAILABLE_THEMES.map((value) => ({ value, label: t.themeNames[value] }))}
              onChange={chooseTheme}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title={t.habitsTitle}>
        <SettingRow
          title={t.defaultLayout}
          description={t.defaultLayoutHint}
          action={
            <SettingsSegmented
              label={t.defaultLayout}
              value={prefs.habitsLayout}
              options={(["day", "week", "matrix"] as const).map((value) => ({ value, label: t.layouts[value] }))}
              onChange={(habitsLayout) => onPreferencesChange({ habitsLayout })}
            />
          }
        />
        <SettingsDivider />
        <SettingRow
          htmlFor="pref-morning-dashboard"
          title={t.morningDashboard}
          description={t.morningDashboardHint}
          action={
            <Switch
              id="pref-morning-dashboard"
              checked={prefs.morningDashboard}
              onCheckedChange={(morningDashboard) => onPreferencesChange({ morningDashboard })}
            />
          }
        />
        <SettingsDivider />
        <SettingRow
          htmlFor="pref-reminder-time"
          title={t.defaultReminderTime}
          description={t.defaultReminderTimeHint}
          action={
            <div className="flex items-center gap-2">
              <input
                id="pref-reminder-time"
                type="time"
                value={prefs.defaultReminderTime}
                onChange={(event) => onPreferencesChange({ defaultReminderTime: event.target.value })}
                className={cn(settingsInputClass, "w-32")}
              />
              {prefs.defaultReminderTime ? (
                <button type="button" onClick={() => onPreferencesChange({ defaultReminderTime: "" })} className={settingsButtonClass()}>
                  {t.clearTime}
                </button>
              ) : null}
            </div>
          }
        />
      </SettingsCard>
    </>
  )
}
