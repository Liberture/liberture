"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

interface CopyBlockProps {
  label?: string
  value: string
  copyLabel: string
  copiedLabel: string
  /** One line (a URL) instead of a multi-line block. */
  inline?: boolean
}

export function CopyBlock({ label, value, copyLabel, copiedLabel, inline = false }: CopyBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the text is still selectable.
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
      <pre
        className={cn(
          "custom-scrollbar overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-foreground",
          inline ? "whitespace-nowrap" : "whitespace-pre-wrap break-words"
        )}
      >
        {value}
      </pre>
    </div>
  )
}
