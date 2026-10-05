import type { Metadata } from "next"
import { BreadcrumbSchema, JsonLd } from "@/components/seo/JsonLd"
import { translations } from "@/lib/translations"

const url = "https://liberture.com/how-it-works"

// Next merges metadata shallowly — a child `openGraph`/`twitter` object replaces
// the root one outright, so the shared image has to be repeated here.
const ogImage = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Liberture — a habit tracker you actually own",
}

export const metadata: Metadata = {
  title: "How It Works | Talk to Your Habits",
  description: "Sign in, add one link to ChatGPT or Claude, and talk to your habit tracker by chat or voice: log habits, hear your streaks, get protocols worth trying.",
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: "How It Works | Liberture",
    description: "Connect ChatGPT or Claude to your Liberture habit tracker and talk to your habits, in chat or by voice.",
    url,
    siteName: "Liberture",
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | Liberture",
    description: "Connect ChatGPT or Claude to your habit tracker and talk to your habits.",
    images: ["/og-image.jpg"],
    site: "@liberture",
    creator: "@liberture",
  },
}

// Mirrors the three setup steps rendered on the page (translations → habits.docs.overview.steps).
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Liberture works",
  description:
    "Connect ChatGPT or Claude to your Liberture habit tracker so it can read your habits and log them for you, in text or voice.",
  url,
  step: translations.en.habits.docs.overview.steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.body,
  })),
}

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={howToSchema} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://liberture.com" },
          { name: "How It Works", url },
        ]}
      />
      {children}
    </>
  )
}
