"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

// Custom animations for each pillar icon (matching landing-pillars.tsx)
const PILLAR_ICON_ANIMATIONS: Record<string, {
  animate: Record<string, number | number[]>
  transition: Record<string, any>
}> = {
  cognition: {
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

interface PillarData {
  name: string
  slug: string
  icon: string
  tagline: string
  description: string
  color: string
  borderColor: string
}

interface AnimatedPillarCardProps {
  pillar: PillarData
  count: number
  index: number
}

export function AnimatedPillarCard({ pillar, count, index }: AnimatedPillarCardProps) {
  const iconAnimation = PILLAR_ICON_ANIMATIONS[pillar.slug] || {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  }

  return (
    <Link href={`/pillars/${pillar.slug}`} className="group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        whileHover={{ scale: 1.03, y: -4 }}
      >
        <Card
          className={`h-full bg-gradient-to-br ${pillar.color} border-2 ${pillar.borderColor} transition-shadow duration-300 hover:shadow-xl`}
        >
          <CardContent className="p-8 space-y-4">
            <div className="flex items-start justify-between">
              <motion.div
                className="text-6xl"
                animate={iconAnimation.animate}
                transition={iconAnimation.transition}
                style={{ transformStyle: "preserve-3d" }}
              >
                {pillar.icon}
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