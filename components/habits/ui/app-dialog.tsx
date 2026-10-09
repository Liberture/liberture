"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { ModalPortal } from "@/components/habits/ui/modal-portal"
import { useTranslations } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * The one modal shell for the tracker: portalled out of the swipe track (see
 * ModalPortal), Escape and backdrop close, focus trapped inside and restored
 * on close, and a "discard changes?" guard when `dirty` is set.
 *
 * Bottom sheet on phones, centred card from `sm` up — the same shape the habit
 * dialog always had.
 */
export function AppDialog({
  open,
  onClose,
  title,
  description,
  dirty = false,
  size = "md",
  header,
  footer,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  /** Visible heading; also the dialog's accessible name. */
  title: ReactNode
  description?: ReactNode
  /** Unsaved edits: Escape/backdrop ask before closing. */
  dirty?: boolean
  size?: "sm" | "md" | "lg"
  /** Replaces the default title row when given (title still labels the dialog). */
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  const t = useTranslations().habits.app.common
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const requestClose = () => {
    if (dirtyRef.current && !window.confirm(t.discardChanges)) return
    onCloseRef.current()
  }
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    // Focus the first field, or the panel itself, once the portal has mounted.
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const autofocus = panel.querySelector<HTMLElement>("[autofocus], [data-autofocus]")
      const first = autofocus ?? panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel).focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        requestCloseRef.current()
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  const width = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-2xl"

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) requestClose()
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={cn(
            "flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl outline-none duration-200 animate-in slide-in-from-bottom-4 sm:max-h-[92dvh] sm:rounded-2xl",
            width,
            className
          )}
        >
          {header ? (
            <div className="border-b border-border">
              <span id={titleId} className="sr-only">
                {title}
              </span>
              {header}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-lg font-bold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label={t.close}
                className="-mr-1 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">{footer}</div>}
        </div>
      </div>
    </ModalPortal>
  )
}
