"use client"

import { CopyButton } from "@/components/habits/ui/copy-button"

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
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <CopyButton value={value} label={copyLabel} copiedLabel={copiedLabel} />
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
