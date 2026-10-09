"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Link2,
  ListChecks,
  ListTodo,
  Lock,
  MessageCircle,
  Mic,
  PlusCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { CopyBlock } from "@/components/habits/docs/copy-block"
import { HowItWorksArt } from "@/components/habits/landing/section-art"
import { FoldedDrift, IslandRidge, TriadBasins } from "@/components/habits/patterns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary } from "@/lib/habits/i18n"
import { cn } from "@/lib/utils"
import { API_SCOPES, DEFAULT_OFF } from "@/lib/habits/api-scopes"

/**
 * "How it works" on the landing page. Every word comes from the docs copy
 * (translations → habits.docs), so the section and /docs never drift apart.
 */

const STEP_ICONS = [UserRound, Link2, MessageCircle]
const CAPABILITY_ICONS = [ListChecks, CheckCircle2, BarChart3, ListTodo, Compass, PlusCircle]
const STEP_ACCENTS = ["text-primary border-primary/40 bg-primary/10", "text-sleep border-sleep/40 bg-sleep/10", "text-nutrition border-nutrition/40 bg-nutrition/10"]

interface HowItWorksProps {
  dict: Dictionary
  /** Public origin, for the connector URL (`${origin}/mcp`). */
  origin: string
}

export function HowItWorks({ dict, origin }: HowItWorksProps) {
  const reduceMotion = useReducedMotion()
  const how = dict.landing.how
  const overview = dict.docs.overview
  const chatgpt = dict.docs.chatgpt
  const claude = dict.docs.claude
  const scopes = dict.docs.permissions.scopes
  const mcpUrl = `${origin}/mcp`
  const copy = { copyLabel: dict.docs.copy, copiedLabel: dict.docs.copied }

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.5, delay, ease: "easeOut" as const },
        }

  return (
    <section id="how-it-works" className="relative scroll-mt-20 overflow-hidden px-4 py-16">
      <FoldedDrift placement="full" gradient="plasma" className="-inset-10" opacity={0.1} />
      <TriadBasins placement="corner" gradient="acidLime" size="360px" className="-right-12 top-10" opacity={0.2} />
      <IslandRidge placement="corner" gradient="neon" size="420px" className="-left-20 bottom-10 rotate-12" opacity={0.15} />
      <div className="relative z-10 mx-auto max-w-6xl sm:px-2">
      {/* Heading */}
      <motion.div className="mb-12 text-center" {...reveal()}>
        <HowItWorksArt />
        <span className="text-sm font-medium uppercase tracking-wider text-primary">{how.eyebrow}</span>
        <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">{how.heading}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">{overview.lead}</p>
      </motion.div>

      {/* 1. Setup in three steps: a timeline */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute left-[1.375rem] top-6 bottom-6 w-px bg-gradient-to-b from-primary via-sleep to-nutrition opacity-40 lg:left-[16.66%] lg:right-[16.66%] lg:top-[1.375rem] lg:bottom-auto lg:h-px lg:w-auto lg:bg-gradient-to-r"
        />
        <ol className="relative grid gap-6 lg:grid-cols-3 lg:gap-8" aria-label={overview.stepsTitle}>
          {overview.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? MessageCircle
            return (
              <motion.li key={step.title} className="flex gap-4 lg:flex-col lg:items-center lg:text-center" {...reveal(i * 0.12)}>
                <span
                  className={cn(
                    "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-background shadow-lg shadow-black/30",
                    STEP_ACCENTS[i]
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[11px] font-bold text-foreground ring-1 ring-white/15">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 rounded-xl border border-white/10 bg-card/85 p-5 backdrop-blur-sm lg:w-full">
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </motion.li>
            )
          })}
        </ol>
      </div>

      {/* 2. What it can do + things to say */}
      <div className="mt-16 grid gap-6 lg:grid-cols-5">
        <motion.div className="lg:col-span-3" {...reveal()}>
          <h3 className="mb-4 text-lg font-semibold text-foreground">{overview.whatTitle}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {overview.what.map((item, i) => {
              const Icon = CAPABILITY_ICONS[i] ?? CheckCircle2
              return (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-card/85 p-4 backdrop-blur-sm transition-colors hover:border-white/20"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{item}</span>
                </li>
              )
            })}
          </ul>
        </motion.div>

        <motion.div className="lg:col-span-2" {...reveal(0.1)}>
          <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-background/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                <Mic className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{overview.phrasesTitle}</h3>
                <p className="text-xs text-muted-foreground">{how.tryTitle}</p>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2">
              {overview.phrases.map((phrase, i) => (
                <motion.li
                  key={phrase}
                  className="rounded-2xl rounded-br-sm bg-primary/90 px-3.5 py-2 text-sm text-primary-foreground shadow-md shadow-black/20"
                  {...(reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0, scale: 0.9 },
                        whileInView: { opacity: 1, scale: 1 },
                        viewport: { once: true },
                        transition: { duration: 0.3, delay: 0.15 + i * 0.05 },
                      })}
                >
                  “{phrase}”
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* 3. Connect: short version of each guide */}
      <motion.div className="mt-16 rounded-2xl border border-white/10 bg-card/85 p-5 backdrop-blur-sm sm:p-8" {...reveal()}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{how.connectTitle}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{how.connectBody}</p>
          </div>
        </div>

        <Tabs defaultValue="claude" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
            <TabsTrigger value="claude" className="gap-2">
              <ClaudeLogo className="h-4 w-4" />
              Claude
            </TabsTrigger>
            <TabsTrigger value="chatgpt" className="gap-2">
              <ChatGPTLogo className="h-4 w-4" />
              ChatGPT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="claude">
            <GuideSteps steps={claude.steps.slice(0, 3)} />
            <CopyBlock label={claude.urlLabel} value={mcpUrl} inline {...copy} />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{claude.voiceTitle}.</span> {claude.voice}
            </p>
            <GuideLink href="/docs/claude" label={`${how.fullGuide}: ${claude.title}`} />
          </TabsContent>

          <TabsContent value="chatgpt">
            <GuideSteps steps={chatgpt.connectorSteps} />
            <CopyBlock label={chatgpt.urlLabel} value={mcpUrl} inline {...copy} />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{chatgpt.voiceTitle}.</span> {chatgpt.voice}
            </p>
            <GuideLink href="/docs/chatgpt" label={`${how.fullGuide}: ${chatgpt.title}`} />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* 4. Permissions and privacy */}
      <motion.div className="mt-6 grid gap-6 lg:grid-cols-5" {...reveal()}>
        <div className="rounded-2xl border border-white/10 bg-card/85 p-5 backdrop-blur-sm sm:p-6 lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-nutrition" aria-hidden />
            <h3 className="text-lg font-semibold text-foreground">{how.permissionsTitle}</h3>
          </div>
          <ul className="flex flex-wrap gap-2">
            {API_SCOPES.map((key) => {
              const off = DEFAULT_OFF.has(key)
              return (
                <li
                  key={key}
                  title={scopes[key].allows}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                    off ? "border-exercise/40 bg-exercise/10 text-exercise" : "border-nutrition/30 bg-nutrition/10 text-nutrition"
                  )}
                >
                  {off ? <Lock className="h-3 w-3" aria-hidden /> : <CheckCircle2 className="h-3 w-3" aria-hidden />}
                  {scopes[key].name}
                  {off ? <span className="text-[10px] uppercase tracking-wide opacity-80">· {how.offByDefault}</span> : null}
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{dict.docs.permissions.lead}</p>
          <GuideLink href="/docs/permissions" label={how.permissionsLink} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/85 p-5 backdrop-blur-sm sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-sleep" aria-hidden />
            <h3 className="text-lg font-semibold text-foreground">{overview.privacyTitle}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{overview.privacy}</p>
          <Link
            href="/docs"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            {how.docsLink}
          </Link>
        </div>
      </motion.div>
      </div>
    </section>
  )
}

function GuideSteps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="rounded-xl border border-white/10 bg-background/50 p-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
            {i + 1}
          </span>
          <p className="mt-3 font-medium text-foreground">{step.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}

function GuideLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
