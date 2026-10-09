import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Building blocks for every Settings tab, so all of them read the same way:
 * a card with a title and one-line purpose, holding rows of "what it is" on the
 * left and the control on the right.
 */

interface SettingsCardProps {
  title?: string
  description?: ReactNode
  /** "danger" for irreversible actions. */
  tone?: "default" | "danger"
  children: ReactNode
  className?: string
}

export function SettingsCard({ title, description, tone = "default", children, className }: SettingsCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        tone === "danger" ? "border-destructive/30 bg-destructive/5" : "border-border bg-background/60",
        className
      )}
    >
      {title ? (
        <div className="mb-4">
          <h3 className={cn("text-sm font-semibold", tone === "danger" ? "text-destructive" : "text-foreground")}>{title}</h3>
          {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  )
}

interface SettingRowProps {
  title: ReactNode
  description?: ReactNode
  /** The control: a switch, a button, a value. */
  action?: ReactNode
  /** Label target, so clicking the text toggles a switch. */
  htmlFor?: string
}

export function SettingRow({ title, description, action, htmlFor }: SettingRowProps) {
  const text = (
    <>
      <span className="block text-sm font-medium text-foreground">{title}</span>
      {description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span> : null}
    </>
  )
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="min-w-0 cursor-pointer">
          {text}
        </label>
      ) : (
        <div className="min-w-0">{text}</div>
      )}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SettingsDivider() {
  return <div className="border-t border-border" />
}

/** Filled secondary button used across Settings; danger turns red on hover. */
export function settingsButtonClass(tone: "default" | "primary" | "danger" = "default"): string {
  return cn(
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    tone === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
    tone === "default" && "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/70",
    tone === "danger" && "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
  )
}

/** Text/time/select fields inside Settings. */
export const settingsInputClass = cn(
  "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground",
  "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
)

interface SettingsSegmentedProps<T extends string> {
  /** Accessible name for the group. */
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  disabled?: boolean
}

/** A small radio group drawn as joined pills, for 2–4 mutually exclusive choices. */
export function SettingsSegmented<T extends string>({ label, value, options, onChange, disabled }: SettingsSegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-border bg-secondary p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            option.value === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
