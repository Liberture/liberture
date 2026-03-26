"use client"

import { motion } from "framer-motion"
import { stagger } from "@/lib/animations"
import { AnimatedPillarCard } from "./AnimatedPillarCard"
import type { PillarData } from "@/types"

interface AnimatedPillarGridProps {
  pillars: readonly PillarData[]
  countMap: Record<string, number>
}

export function AnimatedPillarGrid({ pillars, countMap }: AnimatedPillarGridProps) {
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={stagger.container()}
      initial="initial"
      animate="animate"
    >
      {pillars.map((pillar, index) => (
        <AnimatedPillarCard
          key={pillar.slug}
          pillar={pillar}
          count={countMap[pillar.slug] || 0}
          index={index}
        />
      ))}
    </motion.div>
  )
}
