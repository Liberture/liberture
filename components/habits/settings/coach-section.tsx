"use client"

import { SettingRow, SettingsCard, SettingsDivider, settingsInputClass } from "@/components/habits/settings/settings-ui"
import { Switch } from "@/components/habits/ui/switch"
import { useTranslations } from "@/components/i18n/locale-provider"
import { DEFAULT_COACH_PREFERENCES, type CoachPreferences, type UserPreferences } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

interface CoachSectionProps {
  preferences: UserPreferences
  onPreferencesChange: (patch: Partial<UserPreferences>) => void
}

/** Times a check-in starts at when switched on; the user adjusts from there. */
const DEFAULT_TIMES = { morning: "08:30", afternoon: "14:00", weekly: { day: 0, time: "18:00" } } as const

const MAX_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * Settings for the proactive coach: push check-ins (off until switched on),
 * quiet hours and the daily cap. The same limits bind an assistant's
 * automations through record_coach_nudge.
 */
export function CoachSection({ preferences, onPreferencesChange }: CoachSectionProps) {
  const t = useTranslations().habits.app.coachSettings
  const coach: CoachPreferences = preferences.coach ?? {}
  const checkIns = coach.checkIns ?? {}
  const quiet = coach.quietHours ?? DEFAULT_COACH_PREFERENCES.quietHours
  const max = coach.maxNudgesPerDay ?? DEFAULT_COACH_PREFERENCES.maxNudgesPerDay

  // preferences merge shallowly, so the whole group is written each time.
  const save = (patch: Partial<CoachPreferences>) => onPreferencesChange({ coach: { ...coach, ...patch } })
  const saveCheckIns = (patch: Partial<NonNullable<CoachPreferences["checkIns"]>>) => {
    const next = { ...checkIns, ...patch }
    for (const key of Object.keys(next) as (keyof typeof next)[]) if (next[key] === undefined) delete next[key]
    save({ checkIns: next })
  }

  const timeInput = (id: string, value: string, onChange: (value: string) => void, label: string) => (
    <input
      id={id}
      type="time"
      aria-label={label}
      value={value}
      onChange={(event) => event.target.value && onChange(event.target.value)}
      className={cn(settingsInputClass, "w-32")}
    />
  )

  const dailyCheckIn = (slot: "morning" | "afternoon", title: string, hint: string) => {
    const time = checkIns[slot]
    return (
      <SettingRow
        htmlFor={`coach-${slot}`}
        title={title}
        description={hint}
        action={
          <div className="flex items-center gap-2">
            {time ? timeInput(`coach-${slot}-time`, time, (value) => saveCheckIns({ [slot]: value }), `${title}: ${t.time}`) : null}
            <Switch
              id={`coach-${slot}`}
              aria-label={`${title}: ${t.enable}`}
              checked={Boolean(time)}
              onCheckedChange={(on) => saveCheckIns({ [slot]: on ? DEFAULT_TIMES[slot] : undefined })}
            />
          </div>
        }
      />
    )
  }

  const weekly = checkIns.weekly

  return (
    <SettingsCard title={t.title} description={t.description}>
      {dailyCheckIn("morning", t.morning, t.morningHint)}
      <SettingsDivider />
      {dailyCheckIn("afternoon", t.afternoon, t.afternoonHint)}
      <SettingsDivider />
      <SettingRow
        htmlFor="coach-weekly"
        title={t.weekly}
        description={t.weeklyHint}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {weekly ? (
              <>
                <select
                  aria-label={`${t.weekly}: ${t.weeklyDay}`}
                  value={weekly.day}
                  onChange={(event) => saveCheckIns({ weekly: { ...weekly, day: Number(event.target.value) } })}
                  className={cn(settingsInputClass, "w-36")}
                >
                  {t.days.map((name, day) => (
                    <option key={name} value={day}>
                      {name}
                    </option>
                  ))}
                </select>
                {timeInput("coach-weekly-time", weekly.time, (time) => saveCheckIns({ weekly: { ...weekly, time } }), `${t.weekly}: ${t.time}`)}
              </>
            ) : null}
            <Switch
              id="coach-weekly"
              aria-label={`${t.weekly}: ${t.enable}`}
              checked={Boolean(weekly)}
              onCheckedChange={(on) => saveCheckIns({ weekly: on ? { ...DEFAULT_TIMES.weekly } : undefined })}
            />
          </div>
        }
      />
      <SettingsDivider />
      <SettingRow
        htmlFor="coach-missed-logging"
        title={t.missedLogging}
        description={t.missedLoggingHint}
        action={
          <Switch
            id="coach-missed-logging"
            checked={coach.missedLogging ?? DEFAULT_COACH_PREFERENCES.missedLogging}
            onCheckedChange={(missedLogging) => save({ missedLogging })}
          />
        }
      />
      <SettingsDivider />
      <SettingRow
        title={t.quietHours}
        description={t.quietHoursHint}
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t.quietFrom}</span>
            {timeInput("coach-quiet-start", quiet.start, (start) => save({ quietHours: { ...quiet, start } }), `${t.quietHours}: ${t.quietFrom}`)}
            <span>{t.quietTo}</span>
            {timeInput("coach-quiet-end", quiet.end, (end) => save({ quietHours: { ...quiet, end } }), `${t.quietHours}: ${t.quietTo}`)}
          </div>
        }
      />
      <SettingsDivider />
      <SettingRow
        htmlFor="coach-max"
        title={t.maxPerDay}
        description={t.maxPerDayHint}
        action={
          <select
            id="coach-max"
            value={max}
            onChange={(event) => save({ maxNudgesPerDay: Number(event.target.value) })}
            className={cn(settingsInputClass, "w-20")}
          >
            {MAX_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        }
      />
    </SettingsCard>
  )
}
