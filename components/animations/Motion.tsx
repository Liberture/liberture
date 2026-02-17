"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"
import { variants, transition, stagger, hover, viewport, loop } from "@/lib/animations"
import type { Stat } from "@/types"

interface BaseProps {
  children: ReactNode
  className?: string
}

export function MotionContainer({ children, className, delay = 0.1, inView }: BaseProps & { delay?: number; inView?: boolean }) {
  return (
    <motion.div
      className={className}
      variants={stagger.container(delay)}
      initial="initial"
      {...(inView ? { whileInView: "animate", viewport: viewport.once } : { animate: "animate" })}
    >
      {children}
    </motion.div>
  )
}

export function MotionSection({ children, className, delay = 0 }: BaseProps & { delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={viewport.once}
      variants={variants.fadeInUp}
      transition={{ ...transition.smooth, delay }}
    >
      {children}
    </motion.div>
  )
}

export function MotionItem({ children, className, delay = 0, hover: enableHover }: BaseProps & { delay?: number; hover?: boolean }) {
  return (
    <motion.div
      className={className}
      variants={stagger.item}
      transition={{ ...transition.smooth, delay }}
      whileHover={enableHover ? hover.scaleLift : undefined}
    >
      {children}
    </motion.div>
  )
}

export function MotionLoop({ children, className, type = "pulse" }: BaseProps & { type?: keyof typeof loop }) {
  return (
    <motion.div className={className} animate={loop[type]}>
      {children}
    </motion.div>
  )
}

export function MotionStats({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <motion.div className={className} variants={stagger.container()} initial="initial" animate="animate">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1, ...transition.smooth }}
        >
          <div className="text-4xl font-bold">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export function MotionPage({ children, className }: BaseProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={transition.normal}
    >
      {children}
    </motion.div>
  )
}

export function MotionPresence({ children, mode = "wait" }: { children: ReactNode; mode?: "sync" | "wait" | "popLayout" }) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>
}
