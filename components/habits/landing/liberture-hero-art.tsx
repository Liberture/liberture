"use client"

import { motion } from "framer-motion"

import { FoldedDrift, RippleBloom } from "@/components/habits/patterns"
import { PILLAR_HEX, PILLAR_ICON_MAP, PILLAR_IDS, PILLAR_LABELS, PILLAR_STYLES, type PillarId } from "@/lib/habits/pillars"

/**
 * The Liberture landing hero's background and pillar buttons, taken from
 * /root/liberture/app/(site)/(landing)/landing-hero.tsx with the same
 * framer-motion code. Pillar buttons open that pillar's protocols here.
 */

const PILLAR_GLOW: Record<PillarId, string> = {
  work: "#8B5CF6",
  sleep: "#06B6D4",
  nutrition: "#10B981",
  mind: "#EC4899",
  exercise: "#F59E0B",
  finance: "#EAB308",
}

function getOrbitKeyframes(index: number, total: number) {
  const a = 480
  const b = 200
  const steps = 90
  const phaseOffset = (index / total) * 2 * Math.PI
  const x: number[] = []
  const y: number[] = []
  const scale: number[] = []
  const opacity: number[] = []

  for (let i = 0; i <= steps; i++) {
    const angle = (2 * Math.PI * i) / steps + phaseOffset
    x.push(Math.round(a * Math.cos(angle)))
    y.push(Math.round(b * Math.sin(angle)))
    const depth = (Math.sin(angle) + 1) / 2
    scale.push(+(0.7 + depth * 0.6).toFixed(2))
    opacity.push(+(0.15 + depth * 0.3).toFixed(2))
  }

  return { x, y, scale, opacity }
}

/** Contour drift, corner ripple and the elliptic orbit of pillar icons. */
export function HeroBackground() {
  return (
    <>
      <FoldedDrift placement="full" gradient="plasma" className="-inset-10" opacity={0.16} />
      <RippleBloom placement="corner" gradient="neon" size="420px" className="-right-10 -top-10 rotate-6" opacity={0.24} />

      {/* Elliptic orbit of pillar icons */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2">
          {PILLAR_IDS.map((pillar, index) => {
            const Icon = PILLAR_ICON_MAP[pillar]
            const keyframes = getOrbitKeyframes(index, PILLAR_IDS.length)
            const glowColor = PILLAR_GLOW[pillar]
            return (
              <motion.div
                key={`orbit-${pillar}`}
                className="absolute"
                style={{ marginLeft: -24, marginTop: -24 }}
                animate={keyframes}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                <Icon
                  className={`h-12 w-12 ${PILLAR_STYLES[pillar].text}`}
                  style={{ filter: `drop-shadow(0 0 16px ${glowColor}) drop-shadow(0 0 6px ${glowColor})` }}
                  strokeWidth={1.5}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </>
  )
}

/** The row of animated pillar buttons under the hero's call to action. */
export function HeroPillarButtons() {
  return (
    <motion.div
      // Phones: two rows of three. From md up: one centred row, as before.
      className="mx-auto grid max-w-xs grid-cols-3 justify-items-center gap-6 md:flex md:max-w-none md:flex-wrap md:items-center md:justify-center md:gap-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {PILLAR_IDS.map((pillar, index) => {
        const Icon = PILLAR_ICON_MAP[pillar]
        const color = PILLAR_HEX[pillar]
        return (
          <a key={pillar} href={`/pillars/${pillar}`}>
            <motion.div
              className="group flex cursor-pointer flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.2, y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            >
              <motion.div
                className="rounded-xl border border-border/50 bg-card p-4 transition-all duration-300 group-hover:border-border group-hover:shadow-lg"
                animate={{ y: [0, -3, 0], rotate: [0, 2, 0, -2, 0] }}
                transition={{ duration: 3 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ boxShadow: `0 0 24px ${color}50`, borderColor: color }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ rotate: 360 }}
                >
                  <Icon className={`h-8 w-8 ${PILLAR_STYLES[pillar].text}`} />
                </motion.div>
              </motion.div>
              <span className="text-xs text-muted-foreground transition-colors">{PILLAR_LABELS[pillar]}</span>
            </motion.div>
          </a>
        )
      })}
    </motion.div>
  )
}
