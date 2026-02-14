"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"

interface AnimatedHeroProps {
  children: ReactNode
  className?: string
}

export function AnimatedHero({ children, className }: AnimatedHeroProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedHeroItemProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedHeroItem({ children, className, delay = 0 }: AnimatedHeroItemProps) {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
      transition={{ delay, duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedIconProps {
  children: ReactNode
  className?: string
  animation?: "pulse" | "bounce" | "none"
}

export function AnimatedIcon({ children, className, animation = "pulse" }: AnimatedIconProps) {
  const animations = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
    },
    bounce: {
      y: [0, -8, 0],
    },
    none: {},
  }

  return (
    <motion.div
      className={className}
      animate={animations[animation]}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedStatsProps {
  stats: Array<{ value: string | number; label: string }>
  className?: string
}

export function AnimatedStats({ stats, className }: AnimatedStatsProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
        >
          <div className="text-4xl font-bold">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}