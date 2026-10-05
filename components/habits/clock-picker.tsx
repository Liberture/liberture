"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { Button } from "@/components/habits/ui/button"

interface ClockPickerProps {
  value: string
  onChange: (value: string) => void
  onClose?: () => void
  inline?: boolean
}

const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 5
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2)

function ScrollColumn({
  items,
  selectedIndex,
  onSelect,
  label,
}: {
  items: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  label: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(false)

  const scrollToIndex = useCallback(
    (index: number, smooth = true) => {
      if (!containerRef.current) return
      const scrollTop = index * ITEM_HEIGHT
      containerRef.current.scrollTo({
        top: scrollTop,
        behavior: smooth ? "smooth" : "auto",
      })
    },
    []
  )

  // Initial scroll to selected index on mount
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToIndex(selectedIndex, false)
      })
    }
  }, [selectedIndex, scrollToIndex])

  // Scroll when selectedIndex changes externally (e.g. AM/PM toggle)
  useEffect(() => {
    if (isMountedRef.current && !isScrollingRef.current) {
      scrollToIndex(selectedIndex, true)
    }
  }, [selectedIndex, scrollToIndex])

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    isScrollingRef.current = true

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return
      const scrollTop = containerRef.current.scrollTop
      const index = Math.round(scrollTop / ITEM_HEIGHT)
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index))

      onSelect(clampedIndex)
      scrollToIndex(clampedIndex, true)

      setTimeout(() => {
        isScrollingRef.current = false
      }, 100)
    }, 80)
  }, [items.length, onSelect, scrollToIndex])

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </span>
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      >
        {/* Top/bottom fade masks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[calc(40%)] bg-gradient-to-b from-card to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[calc(40%)] bg-gradient-to-t from-card to-transparent" />

        {/* Selection highlight */}
        <div
          className="pointer-events-none absolute inset-x-1 z-[5] rounded-lg bg-primary/10 border border-primary/20"
          style={{
            top: CENTER_INDEX * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
        />

        <div
          ref={containerRef}
          className="h-full overflow-y-auto scroll-smooth scrollbar-none"
          onScroll={handleScroll}
          style={{
            scrollSnapType: "y mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Top padding to allow first item to center */}
          <div style={{ height: CENTER_INDEX * ITEM_HEIGHT }} />

          {items.map((item, index) => (
            <button
              key={`${item}-${index}`}
              type="button"
              className={cn(
                "flex w-full items-center justify-center text-lg font-medium transition-all duration-150",
                index === selectedIndex
                  ? "text-foreground scale-105"
                  : "text-muted-foreground/50 scale-95"
              )}
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
              }}
              onClick={() => {
                onSelect(index)
                scrollToIndex(index, true)
              }}
            >
              {item}
            </button>
          ))}

          {/* Bottom padding to allow last item to center */}
          <div style={{ height: CENTER_INDEX * ITEM_HEIGHT }} />
        </div>
      </div>
    </div>
  )
}

export function ClockPicker({ value, onChange, onClose, inline }: ClockPickerProps) {
  const t = useTranslations().habits.app.clockPicker
  const [hour, setHour] = useState(12)
  const [minute, setMinute] = useState(0)
  const [period, setPeriod] = useState<"AM" | "PM">("AM")

  // Parse initial value
  useEffect(() => {
    if (value) {
      const parts = value.split(":")
      if (parts.length === 2) {
        const h = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10)
        if (!isNaN(h) && !isNaN(m)) {
          setHour(h === 0 ? 12 : h > 12 ? h - 12 : h)
          setMinute(m)
          setPeriod(h >= 12 ? "PM" : "AM")
        }
      }
    }
  }, [value])

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  )
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  )
  const periods = [t.am, t.pm]

  const formatTime = () => {
    let displayHour = hour
    if (period === "PM" && hour !== 12) {
      displayHour = hour + 12
    } else if (period === "AM" && hour === 12) {
      displayHour = 0
    }
    return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  }

  const handleSave = () => {
    onChange(formatTime())
    onClose?.()
  }

  const content = (
    <div className={cn("bg-card", !inline && "rounded-2xl border border-border shadow-2xl w-full max-w-sm")}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{t.title}</span>
          </div>
          {onClose && !inline && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-accent"
              aria-label={t.close}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Current time display */}
        <div className="flex items-center justify-center gap-1 mt-3">
          <span className="text-4xl font-light tabular-nums text-foreground">
            {String(hour).padStart(2, "0")}
          </span>
          <span className="text-4xl font-light text-muted-foreground">:</span>
          <span className="text-4xl font-light tabular-nums text-foreground">
            {String(minute).padStart(2, "0")}
          </span>
          <span className="text-lg font-medium text-primary ml-2">{period === "PM" ? t.pm : t.am}</span>
        </div>
      </div>

      {/* Scroll wheels */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-center gap-3">
          <ScrollColumn
            items={hours}
            selectedIndex={hour - 1}
            onSelect={(index) => setHour(index + 1)}
            label={t.hour}
          />

          <div className="flex flex-col items-center justify-center self-end mb-[calc(44px*2.5-10px)]">
            <span className="text-2xl font-light text-muted-foreground">:</span>
          </div>

          <ScrollColumn
            items={minutes}
            selectedIndex={minute}
            onSelect={setMinute}
            label={t.minute}
          />

          <ScrollColumn
            items={periods}
            selectedIndex={period === "AM" ? 0 : 1}
            onSelect={(index) => setPeriod(index === 0 ? "AM" : "PM")}
            label=""
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.cancel}
          </Button>
        )}
        <Button size="sm" onClick={handleSave}>
          {t.confirm}
        </Button>
      </div>
    </div>
  )

  if (inline) return content

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t.dialogLabel}
    >
      <div className="w-full sm:w-auto sm:p-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:fade-in duration-200">
        {content}
      </div>
    </div>
  )
}
