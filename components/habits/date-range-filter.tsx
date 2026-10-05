"use client"

import { useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import {
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns"
import { CalendarRange, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

import { Button } from "@/components/habits/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/habits/ui/popover"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { plural } from "@/lib/i18n-format"

/**
 * Period picker for the stats view. Replaces the old "Last 7 days / Last 30
 * days" pair plus its opaque `periodOffset` counter with an explicit
 * start–end range: presets for the common cases, a calendar for anything else,
 * and arrows that step by the length of whatever range is currently selected.
 */

export interface DateRange {
  start: Date
  end: Date
}

export type PresetKey = "7d" | "30d" | "90d" | "month" | "year"

/** Labels live in translations (`dateRangeFilter.presets`), keyed by `key`. */
const PRESETS: Array<{ key: PresetKey; resolve: (today: Date) => DateRange }> = [
  { key: "7d", resolve: (t) => ({ start: subDays(t, 6), end: t }) },
  { key: "30d", resolve: (t) => ({ start: subDays(t, 29), end: t }) },
  { key: "90d", resolve: (t) => ({ start: subDays(t, 89), end: t }) },
  { key: "month", resolve: (t) => ({ start: startOfMonth(t), end: endOfMonth(t) }) },
  { key: "year", resolve: (t) => ({ start: startOfYear(t), end: endOfYear(t) }) },
]

/** The default period, used on first load and by the reset button. */
export function defaultRange(today: Date = new Date()): DateRange {
  const end = startOfDay(today)
  return { start: subDays(end, 6), end }
}

/** Which preset, if any, the given range currently matches. */
function matchingPreset(range: DateRange, today: Date): PresetKey | null {
  for (const preset of PRESETS) {
    const candidate = preset.resolve(today)
    if (isSameDay(candidate.start, range.start) && isSameDay(candidate.end, range.end)) {
      return preset.key
    }
  }
  return null
}

export function rangeLength(range: DateRange): number {
  return differenceInCalendarDays(range.end, range.start) + 1
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  /** Extra content rendered on the left of the bar, e.g. a title. */
  label?: React.ReactNode
  className?: string
}

export function DateRangeFilter({ value, onChange, label, className }: DateRangeFilterProps) {
  const t = useTranslations().habits.app.dateRangeFilter
  const dateLocale = useDateLocale()
  const [open, setOpen] = useState(false)
  const today = useMemo(() => startOfDay(new Date()), [])

  const active = matchingPreset(value, today)
  const length = rangeLength(value)
  const isDefault = active === "7d"

  /** Step a whole window back or forward, clamped so the end never passes today. */
  const shift = (direction: -1 | 1) => {
    const delta = length * direction
    const nextEnd = subDays(value.end, -delta)
    if (nextEnd > today) return
    onChange({ start: subDays(value.start, -delta), end: nextEnd })
  }

  const sameYear = value.start.getFullYear() === value.end.getFullYear()
  const rangeLabel = `${format(value.start, sameYear ? "d MMM" : "d MMM yyyy", { locale: dateLocale })} – ${format(value.end, "d MMM yyyy", { locale: dateLocale })}`

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {label}

      <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.resolve(today))}
            aria-pressed={active === preset.key}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              active === preset.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {t.presets[preset.key]}
          </button>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={active === null ? "default" : "outline"}
            className="h-8 gap-2 text-xs"
            title={t.pickPeriod}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            {active === null ? rangeLabel : t.custom}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {t.pickHint}
          </p>
          <DayPicker
            mode="range"
            selected={{ from: value.start, to: value.end }}
            onSelect={(next) => {
              if (!next?.from) return
              // While only one end is picked, hold the range as a single day so
              // the charts stay valid mid-selection.
              const start = startOfDay(next.from)
              const end = startOfDay(next.to ?? next.from)
              onChange({ start, end })
              if (next.to) setOpen(false)
            }}
            defaultMonth={value.start}
            disabled={{ after: today }}
            numberOfMonths={1}
            navLayout="around"
            showOutsideDays
            weekStartsOn={1}
            locale={dateLocale}
            classNames={{
              root: "w-[260px]",
              months: "w-full",
              month: "relative w-full",
              month_caption: "flex h-9 items-center justify-center px-10",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "contents",
              button_previous:
                "absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted",
              button_next:
                "absolute right-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted",
              chevron: "h-4 w-4 fill-current",
              month_grid: "w-full table-fixed border-separate border-spacing-y-0.5",
              weekdays: "h-7",
              weekday: "h-7 text-center text-[11px] font-medium text-muted-foreground",
              day: "p-0 text-center align-middle",
              day_button:
                "mx-auto flex h-8 w-8 items-center justify-center rounded-md text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            }}
            modifiersClassNames={{
              range_start: "[&_button]:bg-primary [&_button]:text-primary-foreground",
              range_end: "[&_button]:bg-primary [&_button]:text-primary-foreground",
              range_middle: "[&_button]:bg-primary/15 [&_button]:text-foreground",
              today: "[&_button]:ring-1 [&_button]:ring-primary/50",
              outside: "[&_button]:text-muted-foreground/35",
              disabled: "[&_button]:text-muted-foreground/25 [&_button]:pointer-events-none",
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-0.5">
        <Button
          onClick={() => shift(-1)}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          title={plural(t.previousDays, length)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          onClick={() => shift(1)}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          disabled={isSameDay(value.end, today) || value.end > today}
          title={plural(t.nextDays, length)}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          onClick={() => onChange(defaultRange(today))}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          disabled={isDefault}
          title={t.backToDefault}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
        {rangeLabel} <span aria-hidden>·</span> {plural(t.days, length)}
      </span>
    </div>
  )
}
