"use client"

import type { ReactNode } from "react"
import { HelpTooltip } from "@/components/ui/tooltip"

export function BrandMark({ brand }: { brand: "x" | "wikipedia" | "medium" }) {
  return <span aria-hidden className="block size-5 bg-current" style={{ mask: `url(/brand/social/${brand}.svg) center / contain no-repeat` }} />
}

export function SocialIcon({ href, label, children }: { href?: string; label: string; children: ReactNode }) {
  const style = "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5"
  return (
    <HelpTooltip label={label}>
      {href
        ? <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className={style}>{children}</a>
        : <span tabIndex={0} aria-label={label} className={style}>{children}</span>}
    </HelpTooltip>
  )
}
