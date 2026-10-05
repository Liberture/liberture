import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"

import { FAQSchema } from "@/components/seo/JsonLd"
import { GetStartedActions } from "@/components/habits/get-started-actions"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { findProtocol } from "@/lib/habits/protocols/catalog"
import { SITE_URL, screenshotSize, screenshotSrc } from "@/lib/guides"
import { translations } from "@/lib/translations"

const url = `${SITE_URL}/get-started`
const en = translations.en.habits.getStarted

export const metadata: Metadata = {
  title: en.metaTitle,
  description: en.metaDescription,
  alternates: { canonical: url },
  openGraph: {
    title: en.metaTitle,
    description: en.metaDescription,
    url,
    siteName: "Liberture",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: en.metaTitle }],
  },
  twitter: { card: "summary_large_image", title: en.metaTitle, description: en.metaDescription, images: ["/og-image.jpg"] },
}

/** Free, easy, evidence-backed: the protocols worth starting with. */
const STARTERS = ["morning-sunlight-exposure", "daily-walking-baseline", "deep-work-blocks", "daily-mindfulness-meditation"]

export default async function GetStartedPage() {
  const locale = await getRequestLocale()
  const t = translations[locale].habits.getStarted
  const shot = screenshotSize("tracker-today")
  const starters = STARTERS.map((slug) => findProtocol(slug)).filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <div className="relative px-4 py-12 sm:py-16">
      <FAQSchema questions={en.faq.map((f) => ({ question: f.q, answer: f.a }))} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <header>
            <span className="text-sm font-medium uppercase tracking-wider text-primary">{t.eyebrow}</span>
            <h1 className="mt-2 text-balance text-4xl font-bold text-foreground md:text-5xl">{t.title}</h1>
            <p className="mt-4 max-w-xl text-pretty text-lg text-muted-foreground">{t.lead}</p>
            <GetStartedActions create={t.create} signIn={t.signIn} openTracker={t.openTracker} />
          </header>
          <figure className="overflow-hidden rounded-xl border border-white/15 bg-background shadow-2xl shadow-black/50">
            <Image src={screenshotSrc(locale, "tracker-today")} alt={t.shotAlt} width={shot.width} height={shot.height} priority sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full" />
          </figure>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">{t.stepsTitle}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {t.steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-white/10 bg-card/85 p-6 backdrop-blur-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span>
                <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">{t.startersTitle}</h2>
          <p className="mt-2 text-muted-foreground">{t.startersBody}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {starters.map((p) => (
              <li key={p.slug}>
                <Link href={`/protocols/${p.slug}`} className="block h-full rounded-xl border border-white/10 bg-card/85 p-5 transition-colors hover:border-white/25">
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/protocols" className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            {t.browseAll}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground">{t.guidesTitle}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { href: "/guides/track-habits-with-chatgpt", label: t.chatgptGuide },
              { href: "/guides/connect-claude-to-your-habit-tracker", label: t.claudeGuide },
              { href: "/guides/log-habits-by-voice", label: t.voiceGuide },
            ].map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/85 p-4 font-medium text-foreground transition-colors hover:border-white/25">
                  <BookOpen className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground">{t.faqTitle}</h2>
          <dl className="mt-6 space-y-3">
            {t.faq.map((f) => (
              <div key={f.q} className="rounded-xl border border-white/10 bg-card/70 p-5">
                <dt className="font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  )
}
