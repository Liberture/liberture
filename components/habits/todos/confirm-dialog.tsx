"use client"

import type { ReactNode } from "react"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { Button } from "@/components/habits/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"

/**
 * Small "are you sure?" modal on top of AppDialog, used for destructive
 * actions in the todo list and calendar (delete todo / project / event).
 * Replaces `window.confirm`, which can't be styled or translated per button.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: ReactNode
  body?: ReactNode
  /** Defaults to the shared "Delete" label. */
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}) {
  const common = useTranslations().habits.app.common
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          {/* Focus lands on the safe choice. */}
          <Button type="button" variant="ghost" data-autofocus onClick={onClose}>
            {common.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel ?? common.delete}
          </Button>
        </>
      }
    >
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
    </AppDialog>
  )
}
