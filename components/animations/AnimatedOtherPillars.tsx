"use client"

import { motion } from "framer-motion"
import { stagger, transition, hover, loop } from "@/lib/animations"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import type { PillarId } from "@/lib/translations"
import type { PillarWithConfig } from "@/types"

interface Props {
  pillars: PillarWithConfig[]
}

export function AnimatedOtherPillars({ pillars }: Props) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4"
      variants={stagger.container()}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-50px" }}
    >
      {pillars.map((pillar, index) => (
        <motion.div
          key={pillar.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, ...transition.smooth }}
          whileHover={hover.scaleLift}
        >
          <Link href={`/pillars/${pillar.id.toLowerCase()}`} className="group block">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center space-y-2">
                {(() => {
                  const Icon = PILLAR_ICON_MAP[pillar.id as PillarId]
                  const styles = PILLAR_STYLES[pillar.id as PillarId]
                  return (
                    <motion.div className={`flex justify-center ${styles?.text || ''}`} animate={loop.breathe}>
                      {Icon && <Icon className="h-10 w-10" />}
                    </motion.div>
                  )
                })()}
                <h4 className="font-semibold group-hover:text-primary transition-colors">
                  {pillar.config.title}
                </h4>
                <p className="text-xs text-muted-foreground">{pillar.config.tagline}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
