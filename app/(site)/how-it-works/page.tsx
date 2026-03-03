"use client"

import { motion } from "framer-motion"
import {
  Watch,
  BarChart3,
  CircleDot,
  Play,
  CheckCircle2,
  Brain,
  Heart,
  Leaf,
  Zap,
  Dumbbell,
  Wallet,
  Activity,
  TrendingUp,
  Moon,
  Target,
  ListChecks,
  Flame,
  Clock,
  FileText,
  GitBranch,
  Code,
  Send,
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  Star,
  BookOpen,
} from "lucide-react"
import Link from "next/link"
import { LandingSection, LandingSectionHeader } from "../(landing)/landing-section"
import { VortexShell, IslandRidge, TriadBasins, RippleBloom } from "@/components/patterns"
import { stagger } from "@/lib/animations"

const pillars = [
  { id: "cognition", name: "Cognition", icon: Brain, color: "text-cognition", bg: "bg-cognition/10", border: "border-cognition/30" },
  { id: "recovery", name: "Recovery", icon: Heart, color: "text-recovery", bg: "bg-recovery/10", border: "border-recovery/30" },
  { id: "fueling", name: "Fueling", icon: Leaf, color: "text-fueling", bg: "bg-fueling/10", border: "border-fueling/30" },
  { id: "mental", name: "Mental", icon: Zap, color: "text-mental", bg: "bg-mental/10", border: "border-mental/30" },
  { id: "physicality", name: "Physicality", icon: Dumbbell, color: "text-physicality", bg: "bg-physicality/10", border: "border-physicality/30" },
  { id: "finance", name: "Finance", icon: Wallet, color: "text-finance", bg: "bg-finance/10", border: "border-finance/30" },
]

const dataFlowSteps = [
  { icon: Watch, label: "Wearables", sublabel: "Oura, Whoop, Garmin", color: "text-recovery" },
  { icon: BarChart3, label: "Wearable Coach", sublabel: "Analyze patterns", color: "text-primary" },
  { icon: CircleDot, label: "Nostr WoT", sublabel: "Trusted protocols", color: "text-mental" },
  { icon: Play, label: "Executor", sublabel: "Daily actions", color: "text-fueling" },
  { icon: CheckCircle2, label: "Tracker", sublabel: "Log & measure", color: "text-cognition" },
]

const skills = [
  {
    id: "wearable-coach",
    name: "Wearable Coach",
    icon: Activity,
    color: "text-recovery",
    bg: "bg-recovery/10",
    border: "border-recovery/30",
    description: "Analyze your wearable data, find patterns, get WoT-filtered protocol recommendations.",
    capabilities: [
      "Sync from Oura, Whoop, Garmin, Apple Health",
      "HRV trend analysis with baseline tracking",
      "Sleep architecture breakdown (deep, REM, light)",
      "Correlation finder (what affects your metrics)",
      "Training readiness guidance",
      "WoT-filtered protocol recommendations",
      "Weekly analysis summaries",
    ],
    example: {
      user: "How's my recovery today?",
      response: `📊 Readiness: 78 (Good)
💓 HRV: 45ms — above your baseline
😴 Sleep: 7.2h, 88% efficiency, 18% deep

✅ Good day for intensity. Your HRV suggests you're recovered.
⚠️ Deep sleep below target (14% vs 20%).
💡 Try the Temperature Sleep Protocol — 4.3★ from your network.`,
    },
  },
  {
    id: "protocol-executor",
    name: "Protocol Executor",
    icon: Target,
    color: "text-fueling",
    bg: "bg-fueling/10",
    border: "border-fueling/30",
    description: "Turn protocols into daily trackable habits with contextual reminders.",
    capabilities: [
      "Parse protocols into daily actions",
      "Fetch protocols from Nostr (kind 38401)",
      "Create habits in your tracker automatically",
      "Contextual reminders (sunset → dim lights)",
      "Track adherence per-action",
      "Weekly progress reports",
      "Multiple concurrent protocols",
    ],
    example: {
      user: "Start the Huberman sleep protocol",
      response: `✅ Protocol started!

Created 7 habits:
• Morning sunlight (10 min)
• Afternoon light (optional)
• Dim lights after sunset
• Enable night mode
• No screens 1hr before bed
• Cool bedroom (65-68°F)
• Consistent wake time

I'll remind you at the right times. Day 1 starts tomorrow.`,
    },
  },
  {
    id: "habit-tracker",
    name: "Habit Tracker",
    icon: ListChecks,
    color: "text-cognition",
    bg: "bg-cognition/10",
    border: "border-cognition/30",
    description: "Track habits, log completions, visualize streaks and progress.",
    capabilities: [
      "List all habits with stats",
      "Log completions by name or ID",
      "Track streaks (current & longest)",
      "7-day and 30-day completion rates",
      "Generate visual progress charts",
      "Categories and tags",
      "API integration with external trackers",
    ],
    example: {
      user: "I just did my morning meditation",
      response: `✅ Logged: Mindfulness Meditation

🔥 Streak: 12 days (your best is 18)
📊 This week: 6/7 days (86%)
📈 This month: 24/28 days (86%)

Keep it up! 6 more days to beat your record.`,
    },
  },
]

const comingSoon = [
  {
    name: "Study Summarizer",
    icon: BookOpen,
    description: "Given a DOI or PubMed ID, fetch the paper and extract sample size, methodology, findings, limitations. Supports the trust layer.",
  },
  {
    name: "Progress Reporter",
    icon: TrendingUp,
    description: "Weekly rollup across all pillars. What improved, what declined, protocol adherence. Shareable to Nostr.",
  },
  {
    name: "Fasting Timer",
    icon: Clock,
    description: "Smart fasting tracker. Not just a countdown — tracks your windows over time, finds optimal patterns, adapts recommendations.",
  },
]

const nostrEventKinds = [
  { kind: "38401", name: "Protocol", description: "Protocol definitions with actions and study citations" },
  { kind: "38402", name: "Review", description: "Reviews with rating, duration tried, outcome" },
  { kind: "38403", name: "Verification", description: "Study verification (methodology, sample size, verdict)" },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <LandingSection className="relative overflow-hidden pt-32 pb-20">
        <VortexShell
          placement="corner"
          gradient="plasma"
          size="500px"
          className="-right-20 -top-20"
          opacity={0.15}
        />
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={stagger.container()}
        >
          <motion.div variants={stagger.item} className="mb-4">
            <span className="text-primary text-sm font-medium uppercase tracking-wider">
              OpenClaw Skills + Nostr Trust Layer
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={stagger.item}
          >
            Your body's data.{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Protocols you trust.
            </span>
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={stagger.item}
          >
            Wearable data meets community knowledge. AI skills that analyze your metrics, 
            recommend protocols from people you trust, and track what actually works for YOU.
          </motion.p>
        </motion.div>
      </LandingSection>

      {/* The Closed Loop Section */}
      <LandingSection className="relative overflow-hidden bg-card/30">
        <IslandRidge
          placement="corner"
          gradient="neon"
          size="350px"
          className="-left-20 top-10"
          opacity={0.12}
        />
        <LandingSectionHeader
          badge="The System"
          heading="The Closed Loop"
          description="Skills that work together. Your data improves recommendations over time."
        />

        {/* Data Flow Visualization */}
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-8">
            {dataFlowSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.label}
                  className="flex items-center gap-2 md:gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-2`}>
                      <Icon className={`w-6 h-6 md:w-7 md:h-7 ${step.color}`} />
                    </div>
                    <span className="text-xs md:text-sm font-medium">{step.label}</span>
                    <span className="text-xs text-muted-foreground hidden md:block">{step.sublabel}</span>
                  </div>
                  {index < dataFlowSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </motion.div>
              )
            })}
          </div>
          
          <motion.div
            className="text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50">
              ↩ Impact measured → Recommendations improve → The loop closes
            </span>
          </motion.div>
        </div>

        {/* Six Pillars */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-center mb-6">Across All Six Pillars</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon
              return (
                <motion.div
                  key={pillar.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${pillar.bg} border ${pillar.border}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                >
                  <Icon className={`w-4 h-4 ${pillar.color}`} />
                  <span className={`text-sm font-medium ${pillar.color}`}>{pillar.name}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </LandingSection>

      {/* Skills Section */}
      <LandingSection className="relative overflow-hidden">
        <TriadBasins
          placement="corner"
          gradient="acidLime"
          size="400px"
          className="-right-20 top-20"
          opacity={0.1}
        />
        <LandingSectionHeader
          badge="Skills"
          heading="OpenClaw-Compatible Skills"
          description="Real integrations, not toy calculators. Built to work with your AI agent."
        />

        <div className="space-y-12 max-w-6xl mx-auto">
          {skills.map((skill, skillIndex) => {
            const Icon = skill.icon
            return (
              <motion.div
                key={skill.id}
                className={`rounded-2xl border ${skill.border} overflow-hidden`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: skillIndex * 0.15 }}
              >
                <div className={`${skill.bg} p-6 md:p-8`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-card/50 border ${skill.border} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${skill.color}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${skill.color}`}>{skill.name}</h3>
                      <p className="text-muted-foreground mt-1">{skill.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8 bg-card/30">
                  {/* Capabilities */}
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Capabilities</h4>
                    <ul className="space-y-2">
                      {skill.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className={`w-4 h-4 ${skill.color} mt-0.5 flex-shrink-0`} />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Example */}
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Example</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-sm bg-card/50 rounded-lg px-3 py-2 border border-border/50">
                          "{skill.example.user}"
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full ${skill.bg} flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className={`w-3 h-3 ${skill.color}`} />
                        </div>
                        <pre className="text-sm bg-card/50 rounded-lg px-3 py-2 border border-border/50 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                          {skill.example.response}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Coming Soon */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-8">Coming Soon</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {comingSoon.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.name}
                  className="p-5 rounded-xl bg-card/50 border border-border/50 border-dashed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Icon className="w-8 h-8 text-muted-foreground mb-3" />
                  <h4 className="font-semibold mb-1">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </LandingSection>

      {/* Trust Layer Section */}
      <LandingSection className="relative overflow-hidden bg-card/30">
        <RippleBloom
          placement="corner"
          gradient="plasma"
          size="380px"
          className="-left-20 bottom-0"
          opacity={0.12}
        />
        <LandingSectionHeader
          badge="Trust Layer"
          heading="You don't trust Liberture. You trust people you follow."
          description="Protocols, reviews, and study verifications are Nostr events. Decentralized. Portable. Filtered by your Web of Trust."
        />

        {/* Protocol Example Card */}
        <motion.div
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">Morning Light Protocol</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Morning sunlight exposure + evening light reduction to optimize circadian rhythm. Based on peer-reviewed research.
                  </p>
                </div>
                <CircleDot className="w-5 h-5 text-mental flex-shrink-0" />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">4.3</span>
                  <span className="text-muted-foreground">WoT Rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">23</span>
                  <span className="text-muted-foreground">Trusted Reviews</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-fueling" />
                  <span className="font-medium">3</span>
                  <span className="text-muted-foreground">Verified Studies</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-card/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">@</span>
                </div>
                <div>
                  <p className="text-sm font-medium">@friend_you_trust <span className="text-yellow-500">★★★★★</span></p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "Tried for 60 days. Sleep latency dropped from 45min to 10min. Morning light is the game changer."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nostr Event Kinds */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CircleDot className="w-5 h-5 text-mental" />
            <h3 className="font-semibold">Built on Nostr</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {nostrEventKinds.map((event, index) => (
              <motion.div
                key={event.kind}
                className="p-4 rounded-xl bg-card/50 border border-mental/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <code className="text-xs text-mental font-mono">Kind {event.kind}</code>
                <h4 className="font-medium mt-1">{event.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Filtered by your Web of Trust via{" "}
            <a href="https://nostr-wot.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              nostr-wot.com
            </a>
          </p>
        </div>
      </LandingSection>

      {/* Contribute Section */}
      <LandingSection className="relative overflow-hidden">
        <LandingSectionHeader
          badge="Open Source"
          heading="Create a Skill"
          description="Community-driven. Follow the template, submit a PR."
        />

        <div className="max-w-4xl mx-auto">
          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {[
              { step: 1, title: "Fork", description: "Clone the repo, create a folder in /skills", icon: GitBranch },
              { step: 2, title: "Build", description: "Copy _template, write SKILL.md and implementation", icon: Code },
              { step: 3, title: "Test", description: "Try it with your OpenClaw agent", icon: Play },
              { step: 4, title: "Submit", description: "Open PR, we review and merge", icon: Send },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.step}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-primary">{item.step}</span>
                  </div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Code Block */}
          <motion.div
            className="rounded-xl bg-card border border-border/50 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-card/50 border-b border-border/50">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="text-xs text-muted-foreground ml-2">terminal</span>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code className="text-muted-foreground">
                <span className="text-green-400">git clone</span> https://github.com/liberture/liberture{"\n"}
                <span className="text-green-400">cd</span> liberture/skills{"\n"}
                <span className="text-green-400">cp</span> -r _template my-new-skill
              </code>
            </pre>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <a
              href="https://github.com/liberture/liberture"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              View on GitHub
            </a>
          </motion.div>
        </div>
      </LandingSection>

      {/* Final CTA */}
      <LandingSection className="bg-gradient-to-b from-transparent to-primary/5">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to optimize?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wearables, discover trusted protocols, and start tracking what actually works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/protocols"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-card hover:bg-card/80 border border-border/50 font-semibold transition-colors"
            >
              Browse Protocols
            </Link>
          </div>
        </motion.div>
      </LandingSection>
    </main>
  )
}
