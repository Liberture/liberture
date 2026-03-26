"use client"

import { motion } from "framer-motion"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import type { PillarId } from "@/lib/translations"

interface PillarIconProps {
  pillarId: string
  size?: "sm" | "md" | "lg"
  animate?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-10 w-10",
  lg: "h-16 w-16",
}

export function PillarIcon({ pillarId, size = "md", animate = false, className = "" }: PillarIconProps) {
  const Icon = PILLAR_ICON_MAP[pillarId as PillarId]
  const styles = PILLAR_STYLES[pillarId as PillarId]

  if (!Icon) return null

  const iconEl = <Icon className={`${sizeClasses[size]} ${className}`} />

  if (animate) {
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
