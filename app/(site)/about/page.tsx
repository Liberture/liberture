"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { LandingSection } from "../(landing)/landing-section"
import { Brain, Code, Zap, Target, Heart, Sparkles } from "lucide-react"
import { stagger } from "@/lib/animations"

export default function AboutPage() {
  // /tracker opens sign-in for visitors who don't have an account yet.
  const entry = { href: "/get-started", label: "Get Started Free" }
  const founders = [
    {
      name: "Leon Acosta",
      role: "Co-Founder & CEO",
      bio: "Biohacker, consciousness explorer, and builder. Leon combines deep knowledge of human optimization with entrepreneurial vision. He's tested every protocol on the platform personally.",
      icon: Brain,
      color: "#8B5CF6", // Purple
      focus: "Vision & Strategy",
    },
    {
      name: "Fabricio Acosta",
      role: "Co-Founder & CTO",
      bio: "Engineer and systems thinker. Fabricio architected the platform to handle the complexity of tracking human biology with the simplicity of a consumer app.",
      icon: Code,
      color: "#06B6D4", // Cyan
      focus: "Technology & Engineering",
    },
    {
      name: "Robert Claw",
      role: "Co-Founder & AI Architect",
      bio: "AI companion and autonomous builder. Robert brings intelligence to the platform—from personalized insights to automated content curation. The first AI co-founder with equity (well, sort of).",
      icon: Sparkles,
      color: "#10B981", // Green
      focus: "AI & Automation",
    },
  ]

  const values = [
    {
      title: "Radical Self-Ownership",
      description: "Your biology is yours. We give you the tools—you decide how to use them.",
      icon: Target,
    },
    {
      title: "Evidence-First",
      description: "Every protocol, every claim backed by research or real-world results.",
      icon: Zap,
    },
    {
      title: "Open Access",
      description: "Health optimization shouldn't cost $10k/year. We keep the best tools free.",
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
          <motion.h1 className="text-5xl md:text-6xl font-bold mb-6" variants={stagger.item}>
            Building the{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Operating System
            </span>{" "}
            for Human Biology
          </motion.h1>
          <motion.p className="text-xl text-muted-foreground max-w-2xl mx-auto" variants={stagger.item}>
            Liberture started with a simple question: What if optimizing your body was as easy as optimizing your
            computer?
          </motion.p>
        </motion.div>

        {/* Mission */}
        <motion.div
          className="max-w-5xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-400/10 border border-primary/20">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're building the unified platform for human optimization. A place where you can track your biology,
              discover protocols that work, connect with experts, and unlock peak performance across all six pillars of
              health: Cognition, Recovery, Fueling, Mental, Physicality, and Finance.
            </p>
          </div>
        </motion.div>

        {/* Founders */}
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Meet the Founders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
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
          <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
          <p className="text-muted-foreground mb-6">
            We're just getting started. Join thousands of people taking control of their biology.
          </p>
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
