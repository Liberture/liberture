"use client"

import type { ComponentType } from "react"
import { motion } from "framer-motion"

import { AnalyticsArt, BalanceArt, PillarsArt, ProtocolArt, StreakArt, VoiceArt } from "@/components/habits/landing/feature-art"
import { IslandRidge, TriadBasins } from "@/components/habits/patterns"

/**
 * "Everything You Need to Optimize", from Liberture's LandingFeatures
 * (/root/liberture/app/(site)/(landing)/landing-features.tsx): same heading,
 * corner patterns and card grid, but each card leads with an animated
 * illustration of its idea instead of a static icon.
 */

const ART: ComponentType[] = [PillarsArt, StreakArt, BalanceArt, ProtocolArt, VoiceArt, AnalyticsArt]

interface FeaturesSectionProps {
  heading: string
  description: string
  items: { title: string; body: string }[]
}

export function FeaturesSection({ heading, description, items }: FeaturesSectionProps) {
  return (
    <section id="features" className="relative overflow-hidden px-4 py-20">
      <TriadBasins placement="corner" gradient="acidLime" size="360px" className="-left-10 top-0" opacity={0.22} />
      <IslandRidge placement="corner" gradient="magma" size="420px" className="-right-10 bottom-0 rotate-6" opacity={0.2} />

      <div className="relative z-10 mx-auto max-w-6xl sm:px-2">
        <div className="mb-12 text-center">
          <h2 className="mb-4 mt-2 text-3xl font-bold md:text-4xl">{heading}</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">{description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Art = ART[i] ?? PillarsArt
            return (
              <motion.div
                key={item.title}
                className="rounded-2xl border border-border/50 p-6 backdrop-blur-sm transition-colors hover:border-border"
                style={{ backgroundColor: "var(--card)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              >
                <div className="mb-4 flex h-28 items-center justify-center rounded-xl border border-white/5 bg-background/60">
                  <Art />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
