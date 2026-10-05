"use client"

import { motion, type TargetAndTransition, type Transition } from "framer-motion"

import { PILLAR_ICON_MAP, PILLAR_IDS, PILLAR_LABELS, PILLAR_STYLES, type PillarId } from "@/lib/habits/pillars"
import { MicroterrainRidge, VortexShell } from "@/components/habits/patterns"

/**
 * The six pillars section, taken from the Liberture landing page
 * (/root/liberture/app/(site)/(landing)/landing-pillars.tsx) with the same
 * framer-motion animations. Differences: cards open that pillar's protocols
 * here, copy comes from our i18n, and each card has a solid base
 * under its gradient so the fixed orbit behind the page doesn't show through.
 */

// Custom animations for each pillar icon (verbatim from Liberture)
const PILLAR_ANIMATIONS: Record<PillarId, { animate: TargetAndTransition; transition: Transition }> = {
  work: {
    // Briefcase: a small purposeful tilt
    animate: { rotate: [-3, 3, -3], y: [0, -2, 0] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  sleep: {
    // Moon: slow drifting glow
    animate: { y: [0, -4, 0], opacity: [1, 0.65, 1] },
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  nutrition: {
    // Leaf: gentle swaying and breathing
    animate: { rotate: [-5, 5, -5], scale: [1, 1.05, 1] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  mind: {
    // Brain: thinking pulse effect
    animate: { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  exercise: {
    // Dumbbell: lifting motion
    animate: { y: [0, -8, 0], rotate: [-2, 2, -2] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  finance: {
    // Wallet: opening/closing or coin flip effect
    animate: { rotateY: [0, 180, 360], scale: [1, 0.95, 1] },
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
}

interface PillarsShowcaseProps {
  badge: string
  heading: string
  description: string
  descriptions: Record<PillarId, string>
}

export function PillarsShowcase({ badge, heading, description, descriptions }: PillarsShowcaseProps) {
  return (
    <section id="pillars" className="relative scroll-mt-20 overflow-hidden bg-card/30 px-4 py-20">
      <VortexShell placement="corner" gradient="neon" size="440px" className="-left-24 -top-16" opacity={0.17} />
      <MicroterrainRidge placement="corner" gradient="plasma" size="460px" className="-right-24 bottom-0" opacity={0.15} />
      <div className="relative z-10 mx-auto max-w-6xl sm:px-2">
        <div className="mb-12 text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">{badge}</span>
          <h2 className="mb-4 mt-2 text-3xl font-bold md:text-4xl">{heading}</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLAR_IDS.map((pillar, index) => {
            const Icon = PILLAR_ICON_MAP[pillar]
            const { gradient, border, text } = PILLAR_STYLES[pillar]
            const animation = PILLAR_ANIMATIONS[pillar]

            return (
              <a key={pillar} href={`/pillars/${pillar}`}>
                <motion.div
                  className={`p-6 rounded-2xl bg-gradient-to-b ${gradient} border ${border} cursor-pointer transition-all hover:shadow-lg`}
                  style={{ backgroundColor: "var(--card)" }}
                  whileHover={{ scale: 1.12, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <motion.div animate={animation.animate} transition={animation.transition} style={{ transformStyle: "preserve-3d" }}>
                    <Icon className={`h-10 w-10 ${text} mb-4`} />
                  </motion.div>
                  <h3 className={`text-lg font-semibold mb-2 ${text}`}>{PILLAR_LABELS[pillar]}</h3>
                  <p className="text-sm text-muted-foreground">{descriptions[pillar]}</p>
                </motion.div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
