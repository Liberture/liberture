"use client"

import { motion } from "framer-motion"
import {
  Brain,
  Heart,
  Leaf,
  Zap,
  Dumbbell,
  Wallet,
  ListChecks,
  Target,
  Bot,
  Server,
  KeyRound,
  SlidersHorizontal,
  CalendarCheck,
  Repeat,
  Database,
  Lock,
  GitBranch,
  Download,
  Settings,
  Play,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Share2,
  Store,
  Star,
} from "lucide-react"
import Link from "next/link"
import { LandingSection, LandingSectionHeader } from "../(landing)/landing-section"
import { VortexShell, IslandRidge, TriadBasins, RippleBloom } from "@/components/patterns"
import { stagger } from "@/lib/animations"
import { useTrackerEntry } from "@/lib/tracker/use-entry"

const pillars = [
  { id: "cognition", name: "Cognition", icon: Brain, color: "text-work", bg: "bg-work/10", border: "border-work/30" },
  { id: "recovery", name: "Recovery", icon: Heart, color: "text-sleep", bg: "bg-sleep/10", border: "border-sleep/30" },
  { id: "fueling", name: "Fueling", icon: Leaf, color: "text-nutrition", bg: "bg-nutrition/10", border: "border-nutrition/30" },
  { id: "mental", name: "Mental", icon: Zap, color: "text-mind", bg: "bg-mind/10", border: "border-mind/30" },
  { id: "physicality", name: "Physicality", icon: Dumbbell, color: "text-exercise", bg: "bg-exercise/10", border: "border-exercise/30" },
  { id: "finance", name: "Finance", icon: Wallet, color: "text-finance", bg: "bg-finance/10", border: "border-finance/30" },
]

const loopSteps = [
  { icon: Target, label: "Protocols", sublabel: "Adopt or write your own", color: "text-mind" },
  { icon: SlidersHorizontal, label: "Customize", sublabel: "Steps, schedule, targets", color: "text-primary" },
  { icon: CalendarCheck, label: "Track", sublabel: "Daily habits & streaks", color: "text-nutrition" },
  { icon: TrendingUp, label: "Review", sublabel: "What actually works", color: "text-work" },
]

const modes = [
  {
    id: "protocols",
    name: "Protocols, Your Way",
    icon: Target,
    color: "text-mind",
    bg: "bg-mind/10",
    border: "border-mind/30",
    description:
      "A protocol is a structured routine — a set of steps with a schedule. Start from the library or write your own from scratch. Nothing is prescribed; everything is editable.",
    capabilities: [
      "Browse the protocol library or create your own",
      "Every protocol breaks down into concrete daily steps",
      "Edit steps, schedules, and targets to fit your life",
      "Organize across the six pillars",
      "Set duration and difficulty at your own pace",
      "Your customizations stay yours",
    ],
    example: {
      user: "Adopt the Morning Light protocol, but I wake up at 6am",
      response: `✅ Morning Light — customized

Your version:
• 06:10 — 10 min outdoor light
• Sunset — dim indoor lights
• 21:30 — screens off
• 22:30 — lights out

3 steps became daily habits.
Edit any of them, any time.`,
    },
  },
  {
    id: "tracking",
    name: "Honest Tracking",
    icon: ListChecks,
    color: "text-work",
    bg: "bg-work/10",
    border: "border-work/30",
    description:
      "Check habits off as you go. Streaks, completion rates, and progress over time — measured against your own baseline, not someone else's ideal.",
    capabilities: [
      "One-tap daily completions",
      "Streaks — current and personal best",
      "7-day and 30-day completion rates",
      "Progress per habit, per protocol, per pillar",
      "Pause or reschedule without losing history",
      "Your history is exportable — it belongs to you",
    ],
    example: {
      user: "Morning meditation — done",
      response: `✅ Logged: Morning Meditation

🔥 Streak: 12 days (best: 18)
📊 This week: 6/7 (86%)
📈 This month: 24/28 (86%)

6 more days to beat your record.`,
    },
  },
  {
    id: "ai-api",
    name: "AI-Managed, If You Want",
    icon: Bot,
    color: "text-nutrition",
    bg: "bg-nutrition/10",
    border: "border-nutrition/30",
    description:
      "Every action you can take, an AI assistant can take for you — through one API endpoint, with a key you issue and can revoke. Tell your assistant what you did; it keeps the tracker honest.",
    capabilities: [
      "Full tracker control over a simple REST API",
      "Works with any assistant that can call an API",
      "Create protocols and habits from conversation",
      "Log completions when you mention them in chat",
      "Ask for progress reports in plain language",
      "Scoped API keys — grant access, revoke any time",
    ],
    example: {
      user: "I did my cold shower and skipped the evening walk",
      response: `Logged via API:

✅ Cold Shower — completed
⏭️ Evening Walk — skipped (noted)

POST /api/tracker/habits/cold-shower/log
POST /api/tracker/habits/evening-walk/skip

Walk skips are up this week —
want me to move it to mornings?`,
    },
  },
]

const apiSurface = [
  { method: "GET", path: "/api/tracker/habits", description: "List habits with streaks and completion stats" },
  { method: "POST", path: "/api/tracker/habits", description: "Create a habit — standalone or from a protocol step" },
  { method: "POST", path: "/api/tracker/habits/:id/log", description: "Log a completion (or a skip, honestly)" },
  { method: "GET", path: "/api/tracker/protocols", description: "List protocols and their steps" },
  { method: "POST", path: "/api/tracker/protocols/:id/adopt", description: "Turn a protocol's steps into tracked habits" },
  { method: "GET", path: "/api/tracker/progress", description: "Progress summary — per habit, protocol, or pillar" },
]

const selfHostSteps = [
  { step: 1, title: "Clone", description: "Grab the repo — the same code that runs liberture.com", icon: GitBranch },
  { step: 2, title: "Configure", description: "Point it at your Postgres, set your secrets in .env", icon: Settings },
  { step: 3, title: "Run", description: "Build and start. One Node process, one database", icon: Play },
  { step: 4, title: "Own it", description: "Your habits, your API keys, your data — on your machine", icon: Lock },
]

export default function HowItWorksPage() {
  const entry = useTrackerEntry("Get Started Free")
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
              Self-Hostable Habit Tracker
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={stagger.item}
          >
            A habit tracker{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              you actually own.
            </span>
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={stagger.item}
          >
            Turn protocols into daily habits. Customize everything. Track it yourself,
            or let your AI assistant manage it through the API. Run it on our
            servers — or on yours.
          </motion.p>
        </motion.div>
      </LandingSection>

      {/* The Loop Section */}
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
          heading="Protocols become habits. Habits become data. Data becomes insight."
          description="One loop, four steps — and every step works by hand or through your AI assistant."
        />

        {/* Loop Visualization */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-center gap-1.5 md:gap-4 mb-8">
            {loopSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.label}
                  className="flex items-start gap-1.5 md:gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex flex-col items-center w-16 md:w-28">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center mb-2">
                      <Icon className={`w-6 h-6 md:w-7 md:h-7 ${step.color}`} />
                    </div>
                    <span className="text-xs md:text-sm font-medium text-center">{step.label}</span>
                    <span className="text-xs text-muted-foreground hidden md:block text-center">{step.sublabel}</span>
                  </div>
                  {index < loopSteps.length - 1 && (
                    <div className="h-14 md:h-16 flex items-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
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
              <Repeat className="w-3.5 h-3.5" /> Review what works → adjust the protocol → the loop continues
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

      {/* Modes Section */}
      <LandingSection className="relative overflow-hidden">
        <TriadBasins
          placement="corner"
          gradient="acidLime"
          size="400px"
          className="-right-20 top-20"
          opacity={0.1}
        />
        <LandingSectionHeader
          badge="How You Use It"
          heading="Manual when you want control. AI when you want ease."
          description="The tracker doesn't care who's driving — you, your assistant, or both."
        />

        <div className="space-y-12 max-w-6xl mx-auto">
          {modes.map((mode, modeIndex) => {
            const Icon = mode.icon
            return (
              <motion.div
                key={mode.id}
                className={`rounded-2xl border ${mode.border} overflow-hidden`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: modeIndex * 0.15 }}
              >
                <div className={`${mode.bg} p-6 md:p-8`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-card/50 border ${mode.border} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${mode.color}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${mode.color}`}>{mode.name}</h3>
                      <p className="text-muted-foreground mt-1">{mode.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8 bg-card/30">
                  {/* Capabilities */}
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">What You Get</h4>
                    <ul className="space-y-2">
                      {mode.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className={`w-4 h-4 ${mode.color} mt-0.5 flex-shrink-0`} />
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
                          "{mode.example.user}"
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full ${mode.bg} flex items-center justify-center flex-shrink-0`}>
                          <Sparkles className={`w-3 h-3 ${mode.color}`} />
                        </div>
                        <pre className="text-sm bg-card/50 rounded-lg px-3 py-2 border border-border/50 whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                          {mode.example.response}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </LandingSection>

      {/* Share & Marketplace Section */}
      <LandingSection className="relative overflow-hidden">
        <LandingSectionHeader
          badge="Share"
          heading="Good protocols deserve to travel."
          description="What works for you might work for someone you know. Share it with a link, let them make it theirs — no extra accounts, no special apps."
        />

        <div className="max-w-4xl mx-auto">
          {/* Shared protocol card mock */}
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
                      Morning sunlight exposure + evening light reduction. 4 steps, ~15 min a day.
                    </p>
                  </div>
                  <Share2 className="w-5 h-5 text-primary flex-shrink-0" />
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">4.3</span>
                    <span className="text-muted-foreground">Rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">23</span>
                    <span className="text-muted-foreground">People adopted it</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SlidersHorizontal className="w-4 h-4 text-nutrition" />
                    <span className="font-medium">9</span>
                    <span className="text-muted-foreground">Remixed versions</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-card/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">@</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">A friend who tried it <span className="text-yellow-500">★★★★★</span></p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "60 days in. Sleep latency dropped from 45min to 10min. Morning light is the game changer."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Share / Marketplace strip */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Share2, title: "Share with a link", description: "Send a protocol to a friend. They adopt it, tweak the schedule, and it's theirs." },
              { icon: SlidersHorizontal, title: "Remix, don't copy", description: "Adopted protocols stay editable. Everyone runs their own version." },
              { icon: Store, title: "The marketplace", description: "Browse protocols the community published, rate what you tried, publish your own." },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  className="p-5 rounded-xl bg-card/50 border border-border/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </LandingSection>

      {/* API Section */}
      <LandingSection className="relative overflow-hidden bg-card/30">
        <RippleBloom
          placement="corner"
          gradient="plasma"
          size="380px"
          className="-left-20 bottom-0"
          opacity={0.12}
        />
        <LandingSectionHeader
          badge="The API"
          heading="One endpoint surface. Any assistant."
          description="Everything the tracker does is reachable over REST with a scoped API key. If your AI can make an HTTP request, it can manage your habits."
        />

        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {apiSurface.map((endpoint, index) => (
              <motion.div
                key={endpoint.path + endpoint.method}
                className="p-4 rounded-xl bg-card/50 border border-nutrition/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
              >
                <code className="text-xs font-mono">
                  <span className={endpoint.method === "GET" ? "text-primary" : "text-nutrition"}>{endpoint.method}</span>{" "}
                  <span className="text-foreground/90">{endpoint.path}</span>
                </code>
                <p className="text-xs text-muted-foreground mt-2">{endpoint.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Curl example */}
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
              <span className="text-xs text-muted-foreground ml-2">your assistant, behind the scenes</span>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code className="text-muted-foreground">
                <span className="text-green-400">curl</span> -X POST https://your-instance/api/tracker/habits/meditation/log \{"\n"}
                {"  "}-H <span className="text-cyan-400">"Authorization: Bearer $LIBERTURE_API_KEY"</span>
              </code>
            </pre>
          </motion.div>

          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <KeyRound className="w-4 h-4" />
            <p>You issue the key. You scope it. You revoke it. The assistant works for you — not the other way around.</p>
          </div>
        </div>
      </LandingSection>

      {/* Self-Hosting Section */}
      <LandingSection className="relative overflow-hidden">
        <LandingSectionHeader
          badge="Self-Hostable"
          heading="Our servers, or yours. Same code either way."
          description="Liberture runs anywhere Node and Postgres run. Use liberture.com for convenience — or host it yourself and answer to no one."
        />

        <div className="max-w-4xl mx-auto">
          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {selfHostSteps.map((item, index) => {
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
                    <Icon className="w-5 h-5 text-primary" />
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
                <span className="text-green-400">git clone</span> https://github.com/Liberture/liberture{"\n"}
                <span className="text-green-400">cd</span> liberture && cp .env.example .env{"\n"}
                <span className="text-green-400">pnpm</span> install && pnpm build && pnpm start
              </code>
            </pre>
          </motion.div>

          {/* Data ownership strip */}
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {[
              { icon: Database, title: "Your database", description: "Habits and history live in your Postgres, not a third-party silo." },
              { icon: Server, title: "Your instance", description: "A VPS, a home server, a Raspberry Pi in the closet — your call." },
              { icon: Download, title: "Your exit", description: "Export everything, any time. Leaving should always be easy." },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  className="p-5 rounded-xl bg-card/50 border border-border/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <Icon className="w-8 h-8 text-primary mb-3" />
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              )
            })}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <a
              href="https://github.com/Liberture/liberture"
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
          <h2 className="text-3xl font-bold mb-4">Build habits on your own terms.</h2>
          <p className="text-muted-foreground mb-8">
            Pick a protocol, make it yours, and start tracking — by hand or with your
            assistant doing the bookkeeping.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={entry.href}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors"
            >
              {entry.label}
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
