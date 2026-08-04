import type { Metadata } from "next"
import { BreadcrumbSchema, JsonLd } from "@/components/seo/JsonLd"

const url = "https://liberture.com/how-it-works"

// Next merges metadata shallowly — a child `openGraph`/`twitter` object replaces
// the root one outright, so the shared image has to be repeated here.
const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Liberture — a habit tracker you actually own",
}

export const metadata: Metadata = {
  title: "How It Works | Self-Hostable Habit Tracker",
  description: "Turn protocols into daily habits. Customize everything, track it yourself or let your AI assistant manage it through the API, and share what works. Run it on our servers or your own.",
  alternates: {
    canonical: url,
  },
  openGraph: {
    title: "How It Works | Liberture",
    description: "A habit tracker you actually own. Protocols become habits, tracked by you or your AI assistant — self-hostable, shareable, yours.",
    url,
    siteName: "Liberture",
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | Liberture",
    description: "A habit tracker you actually own. Manual or AI-managed, self-hostable, yours.",
    images: ["/og-image.png"],
    site: "@liberture",
    creator: "@liberture",
  },
}

// Mirrors the four-step loop rendered on the page.
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Liberture works",
  description:
    "Turn protocols into daily habits you can customize, track by hand or through an AI assistant, and self-host.",
  url,
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Protocols",
      text: "Adopt a protocol from the library or write your own from scratch.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Customize",
      text: "Edit the steps, schedule, and targets so the protocol fits your life.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Track",
      text: "Check habits off daily and build streaks — manually or through the API.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Review",
      text: "Review completion rates and progress to see what actually works for you.",
    },
  ],
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
