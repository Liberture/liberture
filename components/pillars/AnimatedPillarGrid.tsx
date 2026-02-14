"use client"

import { motion } from "framer-motion"
import { staggerContainer } from "@/lib/animations"
import { AnimatedPillarCard } from "./AnimatedPillarCard"

interface PillarData {
  name: string
  slug: string
  icon: string
  tagline: string
  description: string
  color: string
  borderColor: string
}

interface AnimatedPillarGridProps {
  pillars: readonly PillarData[]
  countMap: Record<string, number>
}

export function AnimatedPillarGrid({ pillars, countMap }: AnimatedPillarGridProps) {
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {pillars.map((pillar, index) => {
        const count = countMap[pillar.name] || 0
        return (
          <AnimatedPillarCard
            key={pillar.slug}
            pillar={pillar}
            count={count}
            index={index}
          />
        )
      })}
    </motion.div>
  )
}