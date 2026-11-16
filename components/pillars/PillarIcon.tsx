"use client"

import { motion, useReducedMotion } from "framer-motion"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import type { PillarId } from "@/lib/translations"

interface PillarIconProps {
  pillarId: string
  size?: "sm" | "md" | "lg"
  inline?: boolean
  animate?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-10 w-10",
  lg: "h-16 w-16",
}

export function PillarIcon({ pillarId, size = "md", animate = false, inline = false, className = "" }: PillarIconProps) {
  const reduceMotion = useReducedMotion()
  const Icon = PILLAR_ICON_MAP[pillarId as PillarId]
  const styles = PILLAR_STYLES[pillarId as PillarId]

  if (!Icon) return null

  const iconEl = <Icon className={`${sizeClasses[size]} ${className}`} />

  if (inline) {
    return <span aria-hidden="true" className={`inline-flex size-5 shrink-0 items-center justify-center ${styles?.text || ""} motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 motion-safe:group-focus-visible:scale-110 motion-safe:group-focus-visible:-rotate-6`}>
      {iconEl}
    </span>
  }

  if (animate && !reduceMotion) {
    return (
      <motion.div
        className={`mb-4 inline-block ${styles?.text || ""}`}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {iconEl}
      </motion.div>
    )
  }

  return <span className={styles?.text || ""}>{iconEl}</span>
}
