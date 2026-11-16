import type { Metadata } from "next"
import Link from "@/components/i18n/localized-link"
import { getLocale } from "next-intl/server"
import { ChallengeDiscovery } from "@/components/habits/challenges/challenge-discovery"
import { BreadcrumbSchema } from "@/components/seo/JsonLd"
import { getSiteMessages } from "@/lib/i18n/messages.server"
import { translatedAlternates } from "@/lib/seo/translated-routes"

export async function generateMetadata(): Promise<Metadata> {
  const [locale, messages] = await Promise.all([getLocale(), getSiteMessages()])
  const t = messages.habits.challengeDiscovery
  const alternates = translatedAlternates("/challenges", locale)
  const images = [{ url: "/og/challenges.png", width: 1200, height: 630, alt: t.imageAlt }]
  return {
    title: t.metaTitle, description: t.metaDescription, alternates,
    openGraph: { title: t.metaTitle, description: t.metaDescription, url: alternates.canonical, type: "website", images },
    twitter: { card: "summary_large_image", title: t.metaTitle, description: t.metaDescription, images },
  }
}

export default async function ChallengesPage() {
  const [locale, messages] = await Promise.all([getLocale(), getSiteMessages()])
  const t = messages.habits.challengeDiscovery
  const nav = messages.habits.site.nav
  return <div className="pb-16">
    <BreadcrumbSchema schemaOnly items={[
      { name: messages.brand.name, url: translatedAlternates("/", locale).canonical },
      { name: nav.challenges, url: translatedAlternates("/challenges", locale).canonical },
    ]} />
    <ChallengeDiscovery copy={t} full />
    <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="challenge-examples">
      <h2 id="challenge-examples" className="text-center text-2xl font-semibold">{t.examplesHeading}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">{t.examplesIntro}</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {t.examples.map(example => <li key={example.title} className="rounded-xl border bg-card/90 p-5">
          <h3 className="font-semibold">{example.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{example.body}</p>
        </li>)}
      </ul>
    </section>
    <div className="mx-auto grid max-w-6xl gap-5 px-4 py-8 md:grid-cols-2">
      {[{ heading: t.stakesHeading, body: t.stakesBody }, { heading: t.resolutionHeading, body: t.resolutionBody }].map(item => <section key={item.heading} className="rounded-xl border bg-card/90 p-6">
        <h2 className="text-xl font-semibold">{item.heading}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
      </section>)}
    </div>
    <section className="mx-auto max-w-3xl px-4 pt-8 text-center">
      <h2 className="text-2xl font-semibold">{t.closingHeading}</h2>
      <p className="mt-3 text-muted-foreground">{t.closingBody}</p>
      <Link href="/tracker/challenges/new" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{t.create}</Link>
    </section>
  </div>
}
