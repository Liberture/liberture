"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { getPillarAnimation, transition, hover } from "@/lib/animations"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import type { PillarData } from "@/types"
import type { PillarId } from "@/lib/translations"

interface AnimatedPillarCardProps {
  pillar: PillarData
  count: number
  index: number
}

export function AnimatedPillarCard({ pillar, count, index }: AnimatedPillarCardProps) {
  const iconAnim = getPillarAnimation(pillar.slug)
  const Icon = PILLAR_ICON_MAP[pillar.slug as PillarId]
  const styles = PILLAR_STYLES[pillar.slug as PillarId]

  return (
    <Link href={`/pillars/${pillar.slug}`} className="group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, ...transition.slow }}
        whileHover={{ ...hover.scale, y: -4 }}
      >
        <Card className={`h-full bg-gradient-to-br ${pillar.color} border-2 ${pillar.borderColor} transition-shadow duration-300 hover:shadow-xl`}>
          <CardContent className="p-8 space-y-4">
            <div className="flex items-start justify-between">
              <motion.div
                className={styles?.text}
                animate={iconAnim.animate}
                transition={iconAnim.transition}
                style={{ transformStyle: "preserve-3d" }}
              >
                {Icon && <Icon className="h-14 w-14" />}
              </motion.div>
              <Badge variant="secondary" className="text-xs">
                {count} {count === 1 ? "article" : "articles"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                  {pillar.name}
                </h3>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm font-medium text-primary">{pillar.tagline}</p>
            </div>

            <p className="text-sm text-muted-foreground">{pillar.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
