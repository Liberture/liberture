"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { VIEWS, type ActiveView } from "@/components/habits/tracker/use-tracker-view"

interface NavProps {
  activeView: ActiveView
  onSelect: (view: ActiveView) => void
  className?: string
}

/** Desktop: segmented control in the header. Hidden below `md`. */
export function DesktopNav({ activeView, onSelect, className }: NavProps) {
  const t = useTranslations().habits.app.habitTracker
  return (
    <nav aria-label={t.navLabel} className={cn("hidden items-center gap-1 rounded-xl bg-muted/50 p-1 md:flex", className)}>
      {VIEWS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={activeView === id ? "page" : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
            activeView === id
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {t.views[id]}
        </button>
      ))}
    </nav>
  )
}

/**
 * Phone: bottom bar with every view (five slots — Discover holds both the
 * catalog and the coach). Hidden from `md` up.
 */
export function MobileNav({ activeView, onSelect, className }: NavProps) {
  const t = useTranslations().habits.app.habitTracker
  const activeIndex = Math.max(VIEWS.findIndex((v) => v.id === activeView), 0)
  return (
    <nav
      aria-label={t.navLabel}
      className={cn("fixed bottom-0 left-0 right-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-lg md:hidden", className)}
    >
      <div className="relative grid gap-1.5 p-3" style={{ gridTemplateColumns: `repeat(${VIEWS.length}, minmax(0, 1fr))` }}>
        {/* Sliding pill. Width is one column; the offset is that width per slot. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-3 left-3 rounded-lg bg-primary shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform"
          style={{
            width: `calc((100% - ${1.5 + (VIEWS.length - 1) * 0.375}rem) / ${VIEWS.length})`,
            transform: `translateX(calc(${activeIndex} * (100% + 0.375rem)))`,
          }}
        />
        {VIEWS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={activeView === id ? "page" : undefined}
            className={cn(
              "relative z-10 flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-3.5 transition-[color,transform] duration-200 ease-out active:scale-[0.98]",
              activeView === id ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Icon className="size-6" aria-hidden />
            <span className="max-w-full truncate text-xs font-semibold">{t.views[id]}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
