import { translatedAlternates } from "@/lib/seo/translated-routes"
import { getLocale } from "next-intl/server"
import type { Metadata } from "next"
import { BreadcrumbSchema, JsonLd } from "@/components/seo/JsonLd"
import { getSiteMessages } from "@/lib/i18n/messages.server"

const path = "/how-it-works"

// Next merges metadata shallowly — a child `openGraph`/`twitter` object replaces
// the root one outright, so the shared image has to be repeated here.
const ogImage = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Liberture — a habit tracker you actually own",
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = (await getSiteMessages()).habits
  const title = t.landing.how.heading
  const description = t.docs.overview.lead
  const alternates = translatedAlternates(path, locale)
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: "Liberture",
      locale: locale === "en" ? "en_US" : "es_ES",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
      site: "@liberture",
      creator: "@liberture",
    },
  }
}

export default async function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const t = (await getSiteMessages()).habits
  const url = translatedAlternates(path, locale).canonical
  // Mirrors the three setup steps rendered on the page (translations → habits.docs.overview.steps).
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t.landing.how.heading,
    description: t.docs.overview.lead,
    url,
    step: t.docs.overview.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.body,
    })),
  }

  return (
    <>
      <JsonLd data={howToSchema} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://liberture.com" },
          { name: t.landing.how.heading, url },
        ]}
      />
      {children}
    </>
  )
}
