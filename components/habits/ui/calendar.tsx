"use client"

import { DayPicker, type DayPickerProps } from "react-day-picker"
import { format } from "date-fns"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"

export function Calendar(props: DayPickerProps) {
  const locale = useDateLocale()
  const t = useTranslations().habits.app.smartDatePicker
  return (
    <DayPicker
      locale={locale}
      navLayout="around"
      showOutsideDays
      labels={{
        labelPrevious: () => t.prevMonth,
        labelNext: () => t.nextMonth,
        labelDayButton: date => format(date, "PPPP", { locale }),
      }}
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
        selected: props.mode === "single" ? "[&_button]:bg-primary [&_button]:text-primary-foreground" : "",
        range_start: "[&_button]:bg-primary [&_button]:text-primary-foreground",
        range_end: "[&_button]:bg-primary [&_button]:text-primary-foreground",
        range_middle: "[&_button]:bg-primary/15 [&_button]:text-foreground",
        today: "[&_button]:ring-1 [&_button]:ring-primary/50",
        outside: "[&_button]:text-muted-foreground/35",
        disabled: "[&_button]:text-muted-foreground/25 [&_button]:pointer-events-none",
      }}
      {...props}
    />
  )
}
