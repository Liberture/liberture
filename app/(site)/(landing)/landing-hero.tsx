"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap } from "lucide-react"
import { FoldedDrift, RippleBloom } from "@/components/patterns"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"
import { translations } from "@/lib/translations"
import { stagger } from "@/lib/animations"

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
                    whileHover={{ scale: 1.15, y: -4 }}
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
