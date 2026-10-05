"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Bot, Check, ExternalLink, Github, KeyRound, Mic, Zap } from "lucide-react"

import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { FeaturesSection } from "@/components/habits/landing/features-section"
import { HeroBackground, HeroPillarButtons } from "@/components/habits/landing/liberture-hero-art"
import { PillarsShowcase } from "@/components/habits/pillars-showcase"
import { HowItWorks } from "@/components/habits/landing/how-it-works"
import { FoldedDrift, IslandRidge, MicroterrainRidge, RippleBloom, TriadBasins, VortexShell } from "@/components/habits/patterns"
import { AssistantsArt, ControlArt, ConversationArt, RecommendationsArt, SunriseArt } from "@/components/habits/landing/section-art"
import { useHabitsSession } from "@/components/habits/session-provider"
import { getDictionary, type Locale } from "@/lib/habits/i18n"
import { PILLAR_HEX, PILLAR_IDS } from "@/lib/habits/pillars"
import { POST_LOGIN_INTENT } from "@/lib/habits/post-login-intent"
import { cn } from "@/lib/utils"

/**
 * The pre-login landing page. The product is voice-first: there is no chat
 * here, the user's own ChatGPT or Claude talks to the tracker through the API,
 * so the page sells that and sends people to /docs. Sign-in stays a modal
 * opened from the CTAs.
 */

export function LandingHero({ locale, origin }: { locale: Locale; origin: string }) {
  const dict = getDictionary(locale)
  const t = dict.landing
  const router = useRouter()
  const { isSignedIn, openSignIn } = useHabitsSession()

  // Signed-in visitors go straight to the tracker; everyone else signs in first.
  const onSignIn = () => (isSignedIn ? router.push("/tracker") : openSignIn())

  // "Connect your assistant" signs in, then lands on the connect step:
  // the wizard's first step for new users, Settings → Voice assistants for
  // everyone else (components/habit-tracker.tsx reads this flag).
  const connect = () => {
    try {
      sessionStorage.setItem(POST_LOGIN_INTENT, "connect")
    } catch {}
    onSignIn()
  }

  return (
    // overflow-hidden matters: the decorative accents are positioned past the
    // right edge, and without clipping they widen the layout viewport — which
    // on mobile makes the whole page, modal included, render too wide.
    <div className="relative w-full overflow-hidden">
      <div className="relative z-10">
        {/* ---------- Hero (background and pillar buttons as on Liberture) ---------- */}
        <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:pt-14">
          <HeroBackground />
          <div className="relative z-10 mx-auto max-w-3xl text-center sm:px-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
            <Zap className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-medium text-primary">{t.badge}</span>
          </span>

          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {t.title}{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              {t.titleAccent}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">{t.subtitle}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              {t.ctaDashboard}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={connect}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-7 py-3 text-base font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 sm:w-auto"
            >
              <Mic className="h-5 w-5" aria-hidden />
              {t.ctaConnect}
            </button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">{t.note}</p>

          <div className="mt-12">
            <HeroPillarButtons />
          </div>

          <a
            href="https://github.com/liberture/liberture"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/70 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-white/30"
          >
            <Github className="h-4 w-4" aria-hidden />
            {t.github}
          </a>
          </div>
        </section>

        {/* ---------- Features (Liberture's section, animated) ---------- */}
        <FeaturesSection heading={t.featuresHeading} description={t.featuresBody} items={t.features} />

        {/* ---------- The six pillars (Liberture's section, same code) ---------- */}
        <PillarsShowcase badge={t.pillarsEyebrow} heading={t.pillarsHeading} description={t.pillarsBody} descriptions={t.pillarCards} />

        {/* ---------- How it works (from the docs) ---------- */}
        <HowItWorks dict={dict} origin={origin} />

        {/* ---------- Conversation ---------- */}
        <Section eyebrow={t.convoEyebrow} heading={t.convoHeading} art={<ConversationArt />}
          patterns={
            <>
              <RippleBloom placement="corner" gradient="neon" size="380px" className="-left-16 top-6" opacity={0.18} />
              <IslandRidge placement="corner" gradient="acidLime" size="400px" className="-right-16 bottom-0 -rotate-6" opacity={0.16} />
            </>
          }
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-background/60 p-4 backdrop-blur sm:p-6">
            <ul className="space-y-3">
              {t.convo.map((line, i) => {
                const mine = line.who === "you"
                return (
                  <li key={i} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
                    {!mine && (
                      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15" aria-hidden>
                        <Bot className="h-4 w-4 text-primary" />
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-white/10 bg-white/[0.04] text-foreground"
                      )}
                    >
                      <span className="sr-only">{mine ? t.you : t.assistant}: </span>
                      {line.text}
                      {"link" in line && line.link ? (
                        <span className="mt-2 flex items-center gap-1.5 rounded-lg border border-sleep/30 bg-sleep/10 px-2.5 py-1.5 text-xs font-medium text-sleep">
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{line.link}</span>
                        </span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </Section>

        {/* ---------- Recommendations ---------- */}
        <section className="relative overflow-hidden px-4 py-16">
          <VortexShell placement="corner" gradient="magma" size="420px" className="-right-16 -top-12" opacity={0.18} />
          <TriadBasins placement="corner" gradient="plasma" size="340px" className="-left-12 bottom-0" opacity={0.2} />
          <div className="relative z-10 mx-auto max-w-6xl rounded-2xl border border-white/10 p-8 text-center shadow-2xl shadow-black/30 sm:p-10" style={{ backgroundColor: "var(--card)" }}>
            <RecommendationsArt />
            <div className="mb-5 flex items-center justify-center gap-2" aria-hidden>
              {PILLAR_IDS.map((pillar) => (
                <span key={pillar} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PILLAR_HEX[pillar], boxShadow: `0 0 10px ${PILLAR_HEX[pillar]}` }} />
              ))}
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-primary">{t.recsEyebrow}</span>
            <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">{t.recsHeading}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">{t.recsBody}</p>
            <Link
              href="/protocols"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.recsCta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        {/* ---------- Control ---------- */}
        <Section eyebrow={t.controlEyebrow} heading={t.controlHeading} description={t.controlBody} art={<ControlArt />}
          patterns={
            <>
              <IslandRidge placement="corner" gradient="acidLime" size="380px" className="-left-12 -top-6 rotate-12" opacity={0.17} />
              <RippleBloom placement="corner" gradient="plasma" size="420px" className="-right-20 bottom-0" opacity={0.17} />
            </>
          }
        >
          <ul className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            {t.controlItems.map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/85 backdrop-blur-sm px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                </span>
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            <Link href="/docs/permissions" className="hover:text-foreground hover:underline">
              {dict.site.footer.permissions}
            </Link>
          </p>
        </Section>

        {/* ---------- Pick an assistant ---------- */}
        <Section eyebrow={t.assistantsEyebrow} heading={t.assistantsHeading} art={<AssistantsArt />}
          patterns={
            <>
              <MicroterrainRidge placement="full" gradient="neon" className="inset-0" opacity={0.08} />
              <VortexShell placement="corner" gradient="plasma" size="400px" className="-right-20 -top-10" opacity={0.18} />
            </>
          }
        >
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {[
              { href: "/docs/chatgpt", title: t.chatgptTitle, body: t.chatgptBody, Logo: ChatGPTLogo, accent: "border-white/15 hover:border-white/40" },
              { href: "/docs/claude", title: t.claudeTitle, body: t.claudeBody, Logo: ClaudeLogo, accent: "border-[#D97757]/30 hover:border-[#D97757]/70" },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={cn("group rounded-xl border bg-card/85 backdrop-blur-sm p-6 transition-colors", card.accent)}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                    <card.Logo className="h-6 w-6 text-foreground" />
                  </span>
                  <p className="text-lg font-semibold text-foreground">{card.title}</p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{card.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  {t.readGuide}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        {/* ---------- Closing CTA ---------- */}
        <section className="relative overflow-hidden px-4 pb-20 pt-4">
          <FoldedDrift placement="full" gradient="magma" className="-inset-10" opacity={0.12} />
          <RippleBloom placement="corner" gradient="neon" size="380px" className="-left-16 bottom-0" opacity={0.18} />
          {/* Neutral solid card, same as the recommendations box. */}
          <div className="relative z-10 mx-auto max-w-6xl rounded-2xl border border-white/10 p-8 text-center shadow-2xl shadow-black/30 sm:p-10" style={{ backgroundColor: "var(--card)" }}>
            <SunriseArt />
            <h2 className="text-3xl font-bold text-foreground">{t.finalHeading}</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{t.finalBody}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
              >
                {t.ctaStart}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={connect}
                className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-secondary px-7 py-3 text-base font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 sm:w-auto"
              >
                {t.ctaConnect}
              </button>
              <a
                href="https://github.com/liberture/liberture"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-7 py-3 text-base font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 sm:w-auto"
              >
                <Github className="h-5 w-5" aria-hidden />
                GitHub
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  heading,
  description,
  art,
  patterns,
  children,
}: {
  id?: string
  eyebrow: string
  heading: string
  description?: string
  /** Decorative drawing above the eyebrow (components/habits/landing/section-art). */
  art?: ReactNode
  /** Topographic line patterns behind the section (components/habits/patterns). */
  patterns?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="relative scroll-mt-20 overflow-hidden px-4 py-16">
      {patterns}
      <div className="relative z-10 mx-auto max-w-6xl sm:px-2">
        <div className="mb-10 text-center">
          {art}
          <span className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</span>
          <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">{heading}</h2>
          {description ? <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  )
}
