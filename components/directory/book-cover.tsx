"use client"

import { useState } from "react"

export function BookCover({ src, title, compact = false }: { src: string | null; title: string; compact?: boolean }) {
  const [failed, setFailed] = useState<string>()
  if (!src || src === failed) return null
  return <img src={src} alt={compact ? "" : `Cover of ${title}`} width={compact ? 64 : 160} height={compact ? 96 : 240}
    loading={compact ? "lazy" : "eager"} onError={() => setFailed(src)}
    className={compact ? "h-24 w-16 shrink-0 rounded object-contain" : "mx-auto h-auto max-h-64 w-auto max-w-full rounded object-contain"} />
}
