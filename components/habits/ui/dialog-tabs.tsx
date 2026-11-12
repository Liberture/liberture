"use client"

import { useRef, type ComponentType, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

export function DialogTabs<T extends string>({ ids, tab, onChange, icons, labels, label, idBase }: {
  ids: readonly T[]
  tab: T
  onChange: (id: T) => void
  icons: Record<T, ComponentType<{ className?: string }>>
  labels: Record<T, string>
  label: string
  idBase: string
}) {
  const tabRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({})
  // Arrow keys move between tabs (WAI-ARIA tabs pattern, automatic activation).
  const onTabKeyDown = (event: KeyboardEvent) => {
    const index = ids.indexOf(tab)
    const last = ids.length - 1
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? ids[index === last ? 0 : index + 1]
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? ids[index === 0 ? last : index - 1]
          : event.key === "Home"
            ? ids[0]
            : event.key === "End"
              ? ids[last]
              : null
    if (!next) return
    event.preventDefault()
    onChange(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
      onKeyDown={onTabKeyDown}
      className="custom-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-2"
    >
      {ids.map((id) => {
        const Icon: ComponentType<{ className?: string }> = icons[id]
        const selected = tab === id
        return (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[id] = el
            }}
            id={`${idBase}-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={selected ? `${idBase}-panel-${id}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {labels[id]}
          </button>
        )
      })}
    </div>
  )
}
