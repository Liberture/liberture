"use client"

import { Card } from "@/components/habits/ui/card"
import { Label } from "@/components/habits/ui/label"
import { TimeInput } from "@/components/habits/time-input"
import { useTranslations } from "@/components/i18n/locale-provider"

interface SettingsPanelProps {
  title: string
  description?: string
  children?: React.ReactNode
}

/**
 * Generic settings panel container
 */
export function SettingsPanel({ title, description, children }: SettingsPanelProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </Card>
  )
}

/**
 * Reusable time setting field
 */
interface TimeSettingProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function TimeSetting({
  label,
  description,
  value,
  onChange,
  required = false
}: TimeSettingProps) {
  const t = useTranslations().habits.app.settingsPanel
  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s/g, '-')}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <TimeInput
        value={value}
        onChange={onChange}
        placeholder={t.selectTime}
      />
    </div>
  )
}

/**
 * Pre-configured check-in times panel
 */
interface CheckInTimesProps {
  morningTime: string
  middayTime: string
  eveningTime: string
  onMorningChange: (value: string) => void
  onMiddayChange: (value: string) => void
  onEveningChange: (value: string) => void
}

export function CheckInTimesPanel({
  morningTime,
  middayTime,
  eveningTime,
  onMorningChange,
  onMiddayChange,
  onEveningChange
}: CheckInTimesProps) {
  const t = useTranslations().habits.app.settingsPanel
  return (
    <SettingsPanel
      title={t.checkInTitle}
      description={t.checkInDescription}
    >
      <div className="space-y-4">
        <TimeSetting
          label={t.morningLabel}
          description={t.morningHint}
          value={morningTime}
          onChange={onMorningChange}
        />

        <TimeSetting
          label={t.middayLabel}
          description={t.middayHint}
          value={middayTime}
          onChange={onMiddayChange}
        />

        <TimeSetting
          label={t.eveningLabel}
          description={t.eveningHint}
          value={eveningTime}
          onChange={onEveningChange}
        />
      </div>
    </SettingsPanel>
  )
}

/**
 * Single habit time setting
 */
interface HabitTimeSettingProps {
  value: string
  onChange: (value: string) => void
  showRecommendations?: boolean
}

export function HabitTimeSetting({
  value,
  onChange,
  showRecommendations = false
}: HabitTimeSettingProps) {
  const t = useTranslations().habits.app.settingsPanel
  const recommendations = [
    { time: "06:00", label: t.recommendations.earlyMorning.label, description: t.recommendations.earlyMorning.description },
    { time: "07:00", label: t.recommendations.morning.label, description: t.recommendations.morning.description },
    { time: "12:00", label: t.recommendations.lunchBreak.label, description: t.recommendations.lunchBreak.description },
    { time: "18:00", label: t.recommendations.afterWork.label, description: t.recommendations.afterWork.description },
    { time: "20:00", label: t.recommendations.evening.label, description: t.recommendations.evening.description },
  ]

  return (
    <div className="space-y-3">
      <TimeSetting
        label={t.habitTimeLabel}
        description={t.habitTimeHint}
        value={value}
        onChange={onChange}
        required
      />

      {showRecommendations && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t.popularTimes}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {recommendations.map((rec) => (
              <button
                key={rec.time}
                type="button"
                onClick={() => onChange(rec.time)}
                className="p-2 text-left rounded-lg border border-border hover:border-primary/30 hover:bg-primary/10 transition-colors text-xs"
              >
                <div className="font-medium text-foreground">
                  {rec.label}
                </div>
                <div className="text-muted-foreground">
                  {rec.time}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
