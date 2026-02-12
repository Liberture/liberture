"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { translations, type PillarId } from "@/lib/translations"
import { LandingSection, LandingSectionHeader } from "./landing-section"

// Custom animations for each pillar icon
const PILLAR_ANIMATIONS: Record<PillarId, any> = {
  cognition: {
    // Brain: thinking pulse effect
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  recovery: {
    // Heart: heartbeat rhythm
    animate: {
      scale: [1, 1.15, 1, 1.05, 1],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.2, 0.3, 0.5, 1],
    },
  },
  fueling: {
    // Leaf: gentle swaying and breathing
    animate: {
      rotate: [-5, 5, -5],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  mental: {
    // Zap: electric spark flash
    animate: {
      opacity: [1, 0.5, 1, 0.7, 1],
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
    },
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  physicality: {
    // Dumbbell: lifting motion
    animate: {
      y: [0, -8, 0],
      rotate: [-2, 2, -2],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  finance: {
    // Wallet: opening/closing or coin flip effect
    animate: {
      rotateY: [0, 180, 360],
      scale: [1, 0.95, 1],
    },
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export function LandingPillars() {
  const { pillars } = translations.en.landing
  const pillarContent = translations.en.common.pillars
  return (
    <LandingSection id="pillars" className="bg-card/30">
      <LandingSectionHeader heading={pillars.heading} description={pillars.description} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillarContent.map((pillar, index) => {
          const Icon = PILLAR_ICON_MAP[pillar.id]
          const { gradient, border, text } = PILLAR_STYLES[pillar.id]
          const animation = PILLAR_ANIMATIONS[pillar.id]
          
          return (
            <Link key={pillar.id} href={`/pillars/${pillar.id}`}>
              <motion.div
                className={`p-6 rounded-2xl bg-gradient-to-b ${gradient} border ${border} cursor-pointer transition-all hover:shadow-lg`}
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <motion.div
                  animate={animation.animate}
                  transition={animation.transition}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Icon className={`h-10 w-10 ${text} mb-4`} />
                </motion.div>
                <h3 className={`text-lg font-semibold mb-2 ${text}`}>{pillar.name}</h3>
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </LandingSection>
  )
}
