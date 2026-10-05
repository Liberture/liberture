"use client"

import * as React from "react"
import { Clock, Check, ChevronRight, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/habits/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/habits/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer } from "vaul"
import { useTranslations } from "@/components/i18n/locale-provider"

interface SmartTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** Quick picks; `key` looks up the visible label in translations (`smartTimePicker.quick`). */
const QUICK_TIMES = [
  { key: "morning", time: "07:00", icon: "🌅" },
  { key: "midday", time: "12:00", icon: "☀️" },
  { key: "afternoon", time: "15:00", icon: "🌇" },
  { key: "evening", time: "19:00", icon: "🌙" },
  { key: "night", time: "22:00", icon: "🌌" },
] as const

export function SmartTimePicker({
  value,
  onChange,
  placeholder,
  className,
}: SmartTimePickerProps) {
  const t = useTranslations().habits.app.smartTimePicker
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const formatDisplayTime = (time: string) => {
    if (!time) return ""
    const [h, m] = time.split(":").map(Number)
    const hour = h % 12 || 12
    const period = h >= 12 ? t.pm : t.am
    return `${hour}:${String(m).padStart(2, "0")} ${period}`
  }

  const trigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-start text-left font-normal h-10", className)}
      onClick={() => setOpen(true)}
    >
      <Clock className="mr-2 h-4 w-4 opacity-50" />
      {value ? formatDisplayTime(value) : <span>{placeholder ?? t.placeholder}</span>}
    </Button>
  )

  const content = (
    <TimePickerContent 
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
        {trigger}
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[10px] bg-card border-t border-border">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
            <div className="p-4">
              {content}
              <Button className="w-full mt-4" onClick={() => setOpen(false)}>
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
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-4">
          {content}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TimePickerContent({ 
  value, 
  onChange,
  onClose 
}: { 
  value: string, 
  onChange: (val: string) => void,
  onClose: () => void
}) {
  const t = useTranslations().habits.app.smartTimePicker
  const [view, setView] = React.useState<"quick" | "precise">(value ? "precise" : "quick")
  
  // Parse current value safely
  const parseTime = (val: string) => {
    const defaultTime = [8, 0]
    if (!val || !val.includes(":")) return defaultTime
    const parts = val.split(":").map(Number)
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return defaultTime
    return parts
  }

  const [h, m] = parseTime(value)
  const [hour, setHour] = React.useState(h % 12 || 12)
  const [minute, setMinute] = React.useState(isNaN(m) ? 0 : Math.floor(m / 5) * 5)
  const [period, setPeriod] = React.useState<"AM" | "PM">(h >= 12 ? "PM" : "AM")

  const handlePreciseChange = (newHour: number, newMinute: number, newPeriod: "AM" | "PM") => {
    let finalHour = newHour
    if (newPeriod === "PM" && newHour !== 12) finalHour += 12
    if (newPeriod === "AM" && newHour === 12) finalHour = 0
    onChange(`${String(finalHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h4 className="font-medium text-sm">
          {view === "quick" ? t.suggested : t.customTime}
        </h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => setView(view === "quick" ? "precise" : "quick")}
        >
          {view === "quick" ? t.custom : t.quickSelect}
        </Button>
      </div>

      {view === "quick" ? (
        <div className="grid grid-cols-1 gap-2">
          {QUICK_TIMES.map((qt) => (
            <button
              key={qt.time}
              onClick={() => {
                onChange(qt.time)
                onClose()
              }}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md transition-colors",
                value === qt.time 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{qt.icon}</span>
                <span className="text-sm font-medium">{t.quick[qt.key]}</span>
              </div>
              <span className="text-xs opacity-80">
                {qt.time.split(':')[0].padStart(2, '0')}:{qt.time.split(':')[1]} 
                {' '}{Number(qt.time.split(':')[0]) >= 12 ? t.pm : t.am}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between gap-4">
            {/* Hours */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">{t.hour}</label>
              <div className="grid grid-cols-4 gap-1">
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hVal) => (
                  <button
                    key={hVal}
                    onClick={() => {
                      setHour(hVal)
                      handlePreciseChange(hVal, minute, period)
                    }}
                    className={cn(
                      "h-8 w-full text-xs rounded-md transition-all",
                      hour === hVal 
                        ? "bg-primary text-primary-foreground font-bold" 
                        : "hover:bg-muted bg-secondary/30"
                    )}
                  >
                    {hVal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">{t.minute}</label>
            <div className="grid grid-cols-6 gap-1">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((mVal) => (
                <button
                  key={mVal}
                  onClick={() => {
                    setMinute(mVal)
                    handlePreciseChange(hour, mVal, period)
                  }}
                  className={cn(
                    "h-8 w-full text-xs rounded-md transition-all",
                    minute === mVal 
                      ? "bg-primary text-primary-foreground font-bold" 
                      : "hover:bg-muted bg-secondary/30"
                  )}
                >
                  {String(mVal).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {(["AM", "PM"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "secondary"}
                className="flex-1 h-9"
                onClick={() => {
                  setPeriod(p)
                  handlePreciseChange(hour, minute, p)
                }}
              >
                {p === "PM" ? t.pm : t.am}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
