"use client"
import { useTranslations as useUiCopy } from "next-intl"

import Link from "@/components/i18n/localized-link"
import { motion } from "framer-motion"
import { LandingSection } from "../(landing)/landing-section"
import { BrandMark, SocialIcon } from "@/components/ui/social-icon"
import { Globe, Github, Linkedin, Instagram, Brain, Code, Zap, Target, Heart, Sparkles } from "lucide-react"
import { stagger } from "@/lib/animations"

export default function AboutPage() {
  const uiCopy = useUiCopy("publicCopy.about")

  // /tracker opens sign-in for visitors who don't have an account yet.
  const entry = { href: "/get-started", label: uiCopy("getStarted") }
  const founders = [
    {
      name: "Leon Acosta",
      links: [
        { label: "leonacosta.com", href: "https://leonacosta.com/", icon: <Globe /> },
        { label: "GitHub · leonacostaok", href: "https://github.com/leonacostaok", icon: <Github /> },
        { label: "LinkedIn · Leon Acosta", href: "https://linkedin.com/in/leonacosta", icon: <Linkedin /> },
        { label: "X · @leonacosta_", href: "https://x.com/leonacosta_", icon: <BrandMark brand="x" /> },
      ],
      role: uiCopy("leonRole"),
      bio: uiCopy("leonBio"),
      icon: Brain,
      color: "#8B5CF6", // Purple
      focus: uiCopy("leonFocus"),
    },
    {
      name: "Fabricio Acosta",
      links: [
        { label: "fabriok.ar", href: "https://www.fabriok.ar/", icon: <Globe /> },
        { label: "GitHub · fabricio333", href: "https://github.com/fabricio333", icon: <Github /> },
        { label: "LinkedIn · Fabricio Acosta", href: "https://www.linkedin.com/in/fabricio-acosta-ok/", icon: <Linkedin /> },
        { label: "Instagram · @lord._.fabri", href: "https://www.instagram.com/lord._.fabri/", icon: <Instagram /> },
      ],
      role: uiCopy("fabricioRole"),
      bio: uiCopy("fabricioBio"),
      icon: Code,
      color: "#06B6D4", // Cyan
      focus: uiCopy("fabricioFocus"),
    },
  ]

  const values = [
    {
      title: uiCopy("autonomy"),
      description: uiCopy("autonomyDetails"),
      icon: Target,
    },
    {
      title: uiCopy("evidence"),
      description: uiCopy("evidenceDetails"),
      icon: Zap,
    },
    {
      title: uiCopy("access"),
      description: uiCopy("accessDetails"),
      icon: Heart,
    },
  ]

  return (
    <main className="min-h-screen pt-24 pb-16">
      <LandingSection>
        <motion.div
          className="max-w-4xl mx-auto text-center mb-16"
          initial="initial"
          animate="animate"
          variants={stagger.container()}
        >
          <motion.h1 className="text-5xl md:text-6xl font-bold mb-6" variants={stagger.item}>{uiCopy("buildingThe")}{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">{uiCopy("operatingSystem")}</span>{" "}{uiCopy("forHumanBiology")}</motion.h1>
          <motion.p className="text-xl text-muted-foreground max-w-2xl mx-auto" variants={stagger.item}>{uiCopy("libertureStartedWithASimpleQuestionWhatIf")}</motion.p>
        </motion.div>

        {/* Mission */}
        <motion.div
          className="max-w-5xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-400/10 border border-primary/20">
            <h2 className="text-2xl font-bold mb-4">{uiCopy("ourMission")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{uiCopy("weReBuildingTheUnifiedPlatformForHuman")}</p>
          </div>
        </motion.div>

        {/* Founders */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">{uiCopy("meetTheFounders")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {founders.map((founder, index) => {
              const Icon = founder.icon
              return (
                <motion.div
                  key={founder.name}
                  className="p-8 rounded-2xl bg-card border border-border/50 hover:border-border transition-all hover:shadow-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.15 }}
                  whileHover={{ y: -5 }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center"
                    style={{
                      backgroundColor: `${founder.color}20`,
                      border: `2px solid ${founder.color}40`,
                    }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{ color: founder.color }}
                    />
                  </div>
                  <h3 className="text-xl font-bold mb-1">{founder.name}</h3>
                  <p className="text-sm text-primary mb-2">{founder.role}</p>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{founder.bio}</p>
                  <div className="mb-3 flex gap-1">{founder.links.map(link => <SocialIcon key={link.href} href={link.href} label={link.label}>{link.icon}</SocialIcon>)}</div>
                  <div className="pt-4 border-t border-border/50">
                    <span className="text-xs font-semibold" style={{ color: founder.color }}>
                      {founder.focus}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Values */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{uiCopy("ourValues")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  className="p-6 rounded-2xl bg-card/50 border border-border/50"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <Icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="max-w-3xl mx-auto text-center mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">{uiCopy("joinTheMovement")}</h2>
          <p className="text-muted-foreground mb-6">{uiCopy("weReJustGettingStartedJoinThousandsOf")}</p>
          <Link
            href={entry.href}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
          >
            {entry.label}
          </Link>
        </motion.div>
      </LandingSection>
    </main>
  )
}
