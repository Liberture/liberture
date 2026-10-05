"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import { ClockPicker } from "./clock-picker"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer } from "vaul"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimeInput({
  value,
  onChange,
  placeholder: placeholderProp,
  className,
}: TimeInputProps) {
  const t = useTranslations().habits.app.timeInput
  const placeholder = placeholderProp ?? t.placeholder
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  const formatDisplayTime = (time: string) => {
    if (!time) return ""

    if (time.includes(":") && !time.includes(" ")) {
      const [h, m] = time.split(":").map(Number)
      const hour = h % 12 || 12
      const period = h >= 12 ? t.pm : t.am
      return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`
    }

    return time
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground cursor-pointer",
        "hover:border-primary/50 transition-colors flex items-center gap-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={value ? formatMessage(t.selected, { time: formatDisplayTime(value) }) : placeholder}
    >
      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className={cn("flex-1 text-left text-sm", !value && "text-muted-foreground")}>
        {value ? formatDisplayTime(value) : placeholder}
      </span>
    </button>
  )

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-card border-t border-border outline-none">
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted" />
              <Drawer.Title className="sr-only">{t.title}</Drawer.Title>
              <Drawer.Description className="sr-only">
                {t.description}
              </Drawer.Description>
              <div className="p-2">
                <ClockPicker
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue)
                    setOpen(false)
                  }}
                  onClose={() => setOpen(false)}
                  inline
                />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </>
    )
  }

  return (
    <>
      {trigger}
      {open && (
        <ClockPicker
          value={value}
          onChange={(newValue) => {
            onChange(newValue)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
