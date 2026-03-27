"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import { FoldedDrift, RippleBloom } from "@/components/patterns"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { translations } from "@/lib/translations"
import { stagger } from "@/lib/animations"

const PILLAR_GLOW: Record<string, string> = {
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

export function LandingHero() {
  const { hero } = translations.en.landing
  const pillars = translations.en.common.pillars
  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-4">
      <FoldedDrift placement="full" gradient="plasma" className="-inset-10" opacity={0.16} />
      <RippleBloom
        placement="corner"
        gradient="neon"
        size="420px"
        className="-right-10 -top-10 rotate-6"
        opacity={0.24}
      />

      {/* Elliptic orbit of pillar icons */}
      <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2">
          {pillars.map((pillar, index) => {
            const Icon = PILLAR_ICON_MAP[pillar.id]
            const keyframes = getOrbitKeyframes(index, pillars.length)
            const glowColor = PILLAR_GLOW[pillar.id]
            return (
              <motion.div
                key={`orbit-${pillar.id}`}
                className="absolute"
                style={{ marginLeft: -24, marginTop: -24 }}
                animate={keyframes}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Icon
                  className={`h-12 w-12 ${PILLAR_STYLES[pillar.id].text}`}
                  style={{ filter: `drop-shadow(0 0 16px ${glowColor}) drop-shadow(0 0 6px ${glowColor})` }}
                  strokeWidth={1.5}
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="container relative z-10 mx-auto max-w-7xl">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial="initial"
          animate="animate"
          variants={stagger.container()}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            variants={stagger.item}
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">{hero.badge}</span>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance"
            variants={stagger.item}
          >
            {hero.title}{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              {hero.highlight}
            </span>
          </motion.h1>

          <motion.p 
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty"
            variants={stagger.item}
          >
            {hero.description}
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            variants={stagger.item}
          >
            <Link href="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 text-lg px-8">
                {hero.primaryCta} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                {hero.secondaryCta}
              </Button>
            </Link>
          </motion.div>

          {/* Pillar Icons */}
          <motion.div 
            className="flex items-center justify-center gap-6 md:gap-10"
            variants={stagger.item}
          >
            {pillars.map((pillar, index) => {
              const Icon = PILLAR_ICON_MAP[pillar.id]
              return (
                <Link key={pillar.id} href={`/pillars/${pillar.id}`}>
                  <motion.div
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.2, y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  >
                    <motion.div
                      className={`p-4 rounded-xl bg-card border border-border/50 group-hover:border-border transition-all duration-300 group-hover:shadow-lg`}
                      animate={{
                        y: [0, -3, 0],
                        rotate: [0, 2, 0, -2, 0],
                      }}
                      transition={{
                        duration: 3 + index * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      whileHover={{
                        boxShadow: `0 0 24px ${PILLAR_STYLES[pillar.id].color}50`,
                        borderColor: PILLAR_STYLES[pillar.id].color
                      }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2 + index * 0.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        whileHover={{ rotate: 360 }}
                      >
                        <Icon className={`h-8 w-8 ${PILLAR_STYLES[pillar.id].text}`} />
                      </motion.div>
                    </motion.div>
                    <span className={`text-xs text-muted-foreground group-hover:${PILLAR_STYLES[pillar.id].text} transition-colors`}>{pillar.name}</span>
                  </motion.div>
                </Link>
              )
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
