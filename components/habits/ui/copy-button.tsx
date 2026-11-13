"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "./toast"

export function CopyButton({ value, label, copiedLabel, successMessage, errorMessage, disabled, shareIconOnly = false }: {
  value: string
  label: string
  copiedLabel: string
  successMessage?: string
  errorMessage?: string
  shareIconOnly?: boolean
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const Icon = copied ? Check : shareIconOnly ? Share2 : Copy
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (successMessage) notify.success(successMessage)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
      if (errorMessage) notify.error(errorMessage)
    }
  }
  return <Button type="button" variant={shareIconOnly ? "ghost" : "outline"} size={shareIconOnly ? "icon-sm" : "sm"} title={shareIconOnly ? label : undefined} disabled={disabled} onClick={copy}>
    <Icon aria-hidden className="size-4" />
    <span className={shareIconOnly ? "sr-only" : undefined} aria-live="polite">{copied ? copiedLabel : label}</span>
  </Button>
}
