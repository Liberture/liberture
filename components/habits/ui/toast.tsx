"use client"

import { Toaster, toast } from "sonner"
import { useTheme } from "next-themes"

/**
 * Tracker toasts. One <AppToaster /> is mounted by the tracker; anything can
 * call `notify`. Undo toasts stay up a little longer and run `onUndo` once.
 * Toasts are announced politely to screen readers by sonner.
 */
export function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-center"
      theme={resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "system"}
      closeButton
      // Clears the mobile bottom nav.
      offset={88}
      toastOptions={{ className: "font-sans" }}
    />
  )
}

export const notify = {
  success(message: string, description?: string) {
    toast.success(message, { description })
  },
  error(message: string, description?: string) {
    toast.error(message, { description })
  },
  info(message: string, description?: string) {
    toast(message, { description })
  },
  /** A change that can be taken back for a few seconds. */
  undo(message: string, undoLabel: string, onUndo: () => void, description?: string) {
    let used = false
    toast(message, {
      description,
      duration: 7000,
      action: {
        label: undoLabel,
        onClick: () => {
          if (used) return
          used = true
          onUndo()
        },
      },
    })
  },
}
