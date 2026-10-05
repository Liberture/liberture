import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"

import { BreadcrumbSchema, JsonLd } from "@/components/seo/JsonLd"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { SITE_URL, guideOgImage, guidesFor, screenshotSize, screenshotSrc } from "@/lib/guides"
import { formatMessage } from "@/lib/i18n-format"
import { translations } from "@/lib/translations"

const url = `${SITE_URL}/guides`
const en = translations.en.habits.guides

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
    images: [{ url: guideOgImage(en.articles[0].slug), width: 1200, height: 630, alt: en.metaTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: en.metaTitle,
    description: en.metaDescription,
    images: [guideOgImage(en.articles[0].slug)],
  },
}

export default async function GuidesPage() {
  const locale = await getRequestLocale()
  const t = guidesFor(locale)

  return (
    <div className="relative px-4 py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: en.metaTitle,
          description: en.metaDescription,
          url,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: en.articles.map((a, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/guides/${a.slug}`,
              name: a.title,
            })),
          },
        }}
      />
      <BreadcrumbSchema items={[{ name: "Liberture", url: SITE_URL }, { name: en.title, url }]} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">{t.eyebrow}</span>
          <h1 className="mt-2 text-balance text-4xl font-bold text-foreground md:text-5xl">{t.heading}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">{t.lead}</p>
        </header>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.articles.map((article) => {
            const size = screenshotSize(article.hero)
            return (
              <li key={article.slug}>
                <Link
                  href={`/guides/${article.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/85 backdrop-blur-sm transition-colors hover:border-white/25"
                >
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-background">
                    <Image
                      src={screenshotSrc(locale, article.hero)}
                      alt={article.heroAlt}
                      width={size.width}
                      height={size.height}
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-semibold text-foreground">{article.title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {formatMessage(t.minutes, { n: article.minutes })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        {t.readGuide}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground hover:underline">
            {t.docsLink} →
          </Link>
        </p>
      </div>
    </div>
  )
}
