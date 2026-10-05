import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Clock } from "lucide-react"

import { BreadcrumbSchema, JsonLd } from "@/components/seo/JsonLd"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import {
  GUIDES_UPDATED,
  GUIDE_SLUGS,
  SITE_URL,
  findGuide,
  guideImages,
  guideOgImage,
  guidesFor,
  isMobileShot,
  screenshotSize,
  screenshotSrc,
  sectionId,
} from "@/lib/guides"
import { formatMessage } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"

interface GuidePageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }))
}

// Metadata stays English: the URL is the same for every language and search
// engines index the English version.
export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = findGuide("en", slug)
  if (!guide) return {}
  const url = `${SITE_URL}/guides/${slug}`
  const image = { url: guideOgImage(slug), width: 1200, height: 630, alt: guide.title }
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      siteName: "Liberture",
      type: "article",
      publishedTime: GUIDES_UPDATED,
      modifiedTime: GUIDES_UPDATED,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.description, images: [image.url] },
  }
}

function Screenshot({ locale, imageKey, alt, caption, priority = false }: { locale: "en" | "es"; imageKey: string; alt: string; caption?: string; priority?: boolean }) {
  const size = screenshotSize(imageKey)
  const mobile = isMobileShot(imageKey)
  return (
    <figure className={cn("my-8", mobile && "mx-auto max-w-[300px]")}>
      <div className={cn("overflow-hidden border border-white/10 bg-background shadow-2xl shadow-black/40", mobile ? "rounded-[2rem] border-4 border-white/15" : "rounded-xl")}>
        <Image
          src={screenshotSrc(locale, imageKey)}
          alt={alt}
          width={size.width}
          height={size.height}
          priority={priority}
          sizes={mobile ? "300px" : "(min-width: 768px) 720px, 100vw"}
          className="h-auto w-full"
        />
      </div>
      {caption ? <figcaption className="mt-3 text-center text-sm text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  )
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const guide = findGuide(locale, slug)
  const guideEn = findGuide("en", slug)
  if (!guide || !guideEn) notFound()

  const t = guidesFor(locale)
  const url = `${SITE_URL}/guides/${slug}`
  const related = guide.related.map((s) => findGuide(locale, s)).filter((g): g is NonNullable<typeof g> => Boolean(g))

  return (
    <article className="relative px-4 py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guideEn.title,
          description: guideEn.description,
          image: guideImages(guideEn),
          datePublished: GUIDES_UPDATED,
          dateModified: GUIDES_UPDATED,
          author: { "@type": "Organization", name: "Liberture", url: SITE_URL },
          publisher: { "@type": "Organization", name: "Liberture", url: SITE_URL },
          mainEntityOfPage: url,
          inLanguage: "en",
        }}
      />
      {guideEn.howTo && guideEn.steps.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: guideEn.title,
            description: guideEn.description,
            image: `${SITE_URL}${screenshotSrc("en", guideEn.hero)}`,
            step: guideEn.steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, name: text, text })),
          }}
        />
      ) : null}
      <BreadcrumbSchema
        items={[
          { name: "Liberture", url: SITE_URL },
          { name: "Guides", url: `${SITE_URL}/guides` },
          { name: guideEn.title, url },
        ]}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.allGuides}
        </Link>

        <header className="mt-6">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">{t.eyebrow}</span>
          <h1 className="mt-2 text-balance text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">{guide.title}</h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">{guide.description}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatMessage(t.minutes, { n: guide.minutes })}
            </span>
            <time dateTime={GUIDES_UPDATED}>{formatMessage(t.updated, { date: GUIDES_UPDATED })}</time>
          </p>
        </header>

        <Screenshot locale={locale} imageKey={guide.hero} alt={guide.heroAlt} priority />

        <nav aria-label={t.onThisPage} className="rounded-xl border border-white/10 bg-card/70 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.onThisPage}</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {guide.sections.map((section) => (
              <li key={section.heading}>
                <a href={`#${sectionId(section.heading)}`} className="text-foreground/90 hover:text-primary">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-12">
          {guide.sections.map((section) => (
            <section key={section.heading} id={sectionId(section.heading)} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
              <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {"bullets" in section && section.bullets ? (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-3 rounded-lg border border-white/10 bg-card/60 px-4 py-2.5 text-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {"image" in section && section.image ? (
                <Screenshot locale={locale} imageKey={section.image.key} alt={section.image.alt} caption={section.image.caption} />
              ) : null}
            </section>
          ))}
        </div>

        <aside className="mt-16 rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: "var(--card)" }}>
          <h2 className="text-2xl font-bold text-foreground">{t.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t.ctaBody}</p>
          <Link
            href="/tracker"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.ctaButton}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </aside>

        {related.length ? (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-foreground">{t.related}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/guides/${r.slug}`}
                    className="block h-full rounded-xl border border-white/10 bg-card/70 p-4 transition-colors hover:border-white/25"
                  >
                    <p className="font-semibold text-foreground">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  )
}
