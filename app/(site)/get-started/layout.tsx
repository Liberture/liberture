import type { Metadata } from "next"

const url = "https://liberture.com/get-started"

export const metadata: Metadata = {
  title: "Get Started | Build Your Habit Tracker",
  description:
    "Pick the protocols worth your time, read the evidence behind them, and turn them into daily habits. No account needed — everything stays in your browser.",
  alternates: { canonical: url },
  openGraph: {
    title: "Get Started | Liberture",
    description:
      "Choose from a library of evidence-backed protocols and turn them into a habit tracker you own.",
    url,
    siteName: "Liberture",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Liberture — build your habit tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Started | Liberture",
    description: "Turn evidence-backed protocols into daily habits. No account needed.",
    images: ["/og-image.png"],
    site: "@liberture",
    creator: "@liberture",
  },
}

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
