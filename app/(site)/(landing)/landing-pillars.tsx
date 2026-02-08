"use client"

import { motion } from "framer-motion"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { translations } from "@/lib/translations"
import { LandingSection, LandingSectionHeader } from "./landing-section"

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
          return (
            <motion.div
              key={pillar.id}
              className={`p-6 rounded-2xl bg-gradient-to-b ${gradient} border ${border}`}
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2 + index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon className={`h-10 w-10 ${text} mb-4`} />
              </motion.div>
              <h3 className={`text-lg font-semibold mb-2 ${text}`}>{pillar.name}</h3>
              <p className="text-sm text-muted-foreground">{pillar.description}</p>
            </motion.div>
          )
        })}
      </div>
    </LandingSection>
  )
}
