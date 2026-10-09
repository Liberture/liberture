"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Check, ChevronRight, ChevronLeft, X } from "lucide-react"
import { format, addDays, startOfToday, startOfTomorrow, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/habits/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/habits/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer } from "vaul"
import { useTranslations, useDateLocale } from "@/components/i18n/locale-provider"

interface SmartDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Lets a <label htmlFor> point at the trigger button. */
  id?: string
  disabled?: boolean
  "aria-describedby"?: string
}

/** Quick picks; `key` looks up the visible label in translations (`smartDatePicker.quick`). */
const QUICK_DATES = [
  { key: "today", value: () => format(startOfToday(), "yyyy-MM-dd"), icon: "📅" },
  { key: "tomorrow", value: () => format(startOfTomorrow(), "yyyy-MM-dd"), icon: "🌅" },
  { key: "monday", value: () => {
    const today = new Date();
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + (7 - today.getDay() + 1) % 7 || 7);
    return format(resultDate, "yyyy-MM-dd");
  }, icon: "🚀" },
  { key: "nextWeekend", value: () => {
    const today = new Date();
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + (6 - today.getDay() + 7) % 7 || 7);
    return format(resultDate, "yyyy-MM-dd");
  }, icon: "🏖️" },
] as const

export function SmartDatePicker({
  value,
  onChange,
  placeholder,
  className,
  id,
  disabled,
  "aria-describedby": ariaDescribedBy,
}: SmartDatePickerProps) {
  const t = useTranslations().habits.app.smartDatePicker
  const dateLocale = useDateLocale()
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      const date = parseISO(dateStr)
      if (!isValid(date)) return dateStr
      if (isToday(date)) return t.quick.today
      if (isSameDay(date, startOfTomorrow())) return t.quick.tomorrow
      return format(date, t.displayFormat, { locale: dateLocale })
    } catch {
      return dateStr
    }
  }

  const trigger = (
    <Button
      type="button"
      id={id}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-start text-left font-normal h-10", className)}
      onClick={() => setOpen(true)}
    >
      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
      {value ? formatDisplayDate(value) : <span>{placeholder ?? t.placeholder}</span>}
    </Button>
  )

  const content = (
    <DatePickerContent 
      value={value} 
      onChange={(val) => {
        onChange(val)
        if (!isMobile) setOpen(false)
      }} 
      onClose={() => setOpen(false)}
    />
  )

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={setOpen}>
        {/* Plain button, not PopoverTrigger: there is no Popover on this branch,
            and Radix throws outright when the trigger has no Popover ancestor —
            which took down every screen that renders a date field on mobile.
            The button already opens the drawer through its own onClick. */}
        {trigger}
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[10px] bg-card border-t border-border focus:outline-none">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              {content}
              <Button type="button" className="w-full mt-4" onClick={() => setOpen(false)}>
                {t.done}
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-4 focus:outline-none">
          {content}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function DatePickerContent({ 
  value, 
  onChange,
  onClose 
}: { 
  value: string, 
  onChange: (val: string) => void,
  onClose: () => void
}) {
  const t = useTranslations().habits.app.smartDatePicker
  const dateLocale = useDateLocale()
  const [view, setView] = React.useState<"quick" | "calendar">("quick")
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const days = React.useMemo(() => {
    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      if (!isValid(start) || !isValid(end)) return []
      return eachDayOfInterval({ start, end })
    } catch {
      return []
    }
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addDays(endOfMonth(currentMonth), 1))
  const prevMonth = () => setCurrentMonth(addDays(startOfMonth(currentMonth), -1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h4 className="font-medium text-sm">
          {view === "quick" ? t.suggested : isValid(currentMonth) ? format(currentMonth, "MMMM yyyy", { locale: dateLocale }) : t.calendar}
        </h4>
        <Button type="button"
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => setView(view === "quick" ? "calendar" : "quick")}
        >
          {view === "quick" ? t.calendar : t.quickSelect}
        </Button>
      </div>

      {view === "quick" ? (
        <div className="grid grid-cols-1 gap-2">
          {QUICK_DATES.map((qd) => {
            const dateStr = qd.value()
            const dateObj = parseISO(dateStr)
            return (
              <button
                type="button"
                key={qd.key}
                onClick={() => {
                  onChange(dateStr)
                  onClose()
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md transition-colors",
                  value === dateStr 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span>{qd.icon}</span>
                  <span className="text-sm font-medium">{t.quick[qd.key]}</span>
                </div>
                <span className="text-xs opacity-80">
                  {isValid(dateObj) ? format(dateObj, t.shortFormat, { locale: dateLocale }) : ""}
                </span>
              </button>
            )
          })}
          <button
              type="button"
              onClick={() => {
                onChange("")
                onClose()
              }}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted text-foreground/60 transition-colors border border-dashed border-border mt-2"
            >
              <div className="flex items-center gap-2">
                <X className="h-3 w-3" />
                <span className="text-sm font-medium">{t.clear}</span>
              </div>
            </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth} aria-label={t.prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium">{isValid(currentMonth) ? format(currentMonth, "MMM yyyy", { locale: dateLocale }) : ""}</span>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth} aria-label={t.nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {t.weekdayInitials.map((d, i) => (
              <div key={i} className="text-[10px] font-bold text-center text-muted-foreground py-1">
                {d}
              </div>
            ))}
            {/* Empty cells for padding */}
            {isValid(currentMonth) && Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd")
              const isSelected = value === dateStr
              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => {
                    onChange(dateStr)
                    onClose()
                  }}
                  className={cn(
                    "h-8 w-full text-xs rounded-md transition-all flex items-center justify-center",
                    isSelected 
                      ? "bg-primary text-primary-foreground font-bold" 
                      : isToday(day)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-muted"
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
