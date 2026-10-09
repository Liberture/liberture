import { endOfDay, format, isAfter, isBefore, isToday, isTomorrow, isValid, parseISO, startOfDay } from "date-fns"
import type { Locale as DateLocale } from "date-fns"
import type { CalendarEvent, Habit } from "@/lib/habits/types"
import type { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

export type CalendarViewCopy = ReturnType<typeof useTranslations>["habits"]["app"]["calendarView"]
export type TimeFormat = "24h" | "12h"
export type WeekStart = 0 | 1

export const timePattern = (timeFormat: TimeFormat) => (timeFormat === "12h" ? "h:mm a" : "HH:mm")

export function formatTime(date: Date, timeFormat: TimeFormat) {
  return format(date, timePattern(timeFormat))
}

/** "HH:MM" (how todos/habits store times) in the user's clock. */
export function formatClock(value: string | undefined, timeFormat: TimeFormat) {
  if (!value) return ""
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  const date = new Date()
  date.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return formatTime(date, timeFormat)
}

export function nextHourDate(day?: Date) {
  const now = new Date()
  const date = day ? new Date(day) : new Date(now)
  date.setHours(now.getHours() + 1, 0, 0, 0)
  return date
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export function toTimeInputValue(date: Date) {
  return format(date, "HH:mm")
}

export function parseLocalDateTime(date: string, time: string) {
  const parsed = new Date(date + "T" + time)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function parseDay(value?: string) {
  if (!value) return null
  const parsed = parseISO(value + "T00:00:00")
  return isValid(parsed) ? parsed : null
}

export function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

/** A month-cell / all-day selection starts and ends on midnight. */
export function isUntimed(start: Date, end: Date) {
  const midnight = (d: Date) => d.getHours() === 0 && d.getMinutes() === 0
  return midnight(start) && midnight(end)
}

export function formatEventDate(value: string, t: CalendarViewCopy, timeFormat: TimeFormat, dateLocale?: DateLocale) {
  const date = parseISO(value)
  if (!isValid(date)) return t.invalidDate
  const time = formatTime(date, timeFormat)
  if (isToday(date)) return formatMessage(t.todayAt, { time })
  if (isTomorrow(date)) return formatMessage(t.tomorrowAt, { time })
  return format(date, "EEE, MMM d ", { locale: dateLocale }) + time
}

export function formatEventRange(event: CalendarEvent, t: CalendarViewCopy, timeFormat: TimeFormat, dateLocale?: DateLocale) {
  const start = parseISO(event.startsAt)
  const end = parseISO(event.endsAt)
  if (!isValid(start) || !isValid(end)) return t.invalidTime
  const sameDay = dateKey(start) === dateKey(end)
  return sameDay
    ? formatEventDate(event.startsAt, t, timeFormat, dateLocale) + " – " + formatTime(end, timeFormat)
    : formatEventDate(event.startsAt, t, timeFormat, dateLocale) +
        " – " +
        format(end, "EEE, MMM d ", { locale: dateLocale }) +
        formatTime(end, timeFormat)
}

export function eventIntersectsDay(event: CalendarEvent, day: Date) {
  const start = parseISO(event.startsAt)
  const end = parseISO(event.endsAt)
  if (!isValid(start) || !isValid(end)) return false
  return !isAfter(start, endOfDay(day)) && !isBefore(end, startOfDay(day))
}

export function habitRunsOnDate(habit: Habit, day: Date, completed: boolean) {
  if (completed) return true
  if (!habit.schedule || habit.schedule.type === "daily") return true
  if (habit.schedule.type === "specific_days") return habit.schedule.days?.includes(day.getDay()) ?? false
  // times_per_week: any day can count toward the target, as on the board.
  return true
}
