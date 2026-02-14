"use client"

import { motion } from "framer-motion"
import { staggerContainer } from "@/lib/animations"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface PillarConfig {
  title: string
  icon: string
  tagline: string
}

interface AnimatedOtherPillarsProps {
  pillars: Array<{ id: string; config: PillarConfig }>
}

export function AnimatedOtherPillars({ pillars }: AnimatedOtherPillarsProps) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4"
      variants={staggerContainer}
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
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ y: -4, scale: 1.02 }}
        >
          <Link href={`/pillars/${pillar.id.toLowerCase()}`} className="group block">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center space-y-2">
                <motion.div
                  className="text-4xl"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3,
                  }}
                >
                  {pillar.config.icon}
                </motion.div>
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