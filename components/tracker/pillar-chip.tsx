"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { translations, type PillarId } from "@/lib/translations"
import { cn } from "@/lib/utils"

const PILLARS = translations.en.common.pillars

export function pillarName(id: PillarId): string {
  return PILLARS.find((p) => p.id === id)?.name ?? id
}

export function pillarDescription(id: PillarId): string {
  return PILLARS.find((p) => p.id === id)?.description ?? ""
}

/** Small read-only pillar tag, used on protocol and habit cards. */
export function PillarTag({ pillar, className }: { pillar: PillarId; className?: string }) {
  const Icon = PILLAR_ICON_MAP[pillar]
  const styles = PILLAR_STYLES[pillar]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles.text,
        styles.border,
        styles.background,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {pillarName(pillar)}
    </span>
  )
}

/** Selectable pillar card for the wizard's focus step. */
export function PillarChoice({
  pillar,
  selected,
  onToggle,
}: {
  pillar: PillarId
  selected: boolean
  onToggle: () => void
}) {
  const Icon = PILLAR_ICON_MAP[pillar]
  const styles = PILLAR_STYLES[pillar]

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
        selected
          ? cn(styles.border, styles.background, "border-opacity-100")
          : "border-white/10 bg-white/[0.02] hover:border-white/20",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          selected ? styles.background : "bg-white/5",
        )}
      >
        <Icon className={cn("h-5 w-5", selected ? styles.text : "text-muted-foreground")} aria-hidden />
      </span>

      <span className={cn("font-semibold", selected ? styles.text : "text-foreground")}>
        {pillarName(pillar)}
      </span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{pillarDescription(pillar)}</span>

      {selected ? (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full",
            styles.background,
          )}
        >
          <Check className={cn("h-3 w-3", styles.text)} aria-hidden />
        </motion.span>
      ) : null}
    </motion.button>
  )
}
