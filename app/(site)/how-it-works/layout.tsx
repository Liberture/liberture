import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works | Self-Hostable Habit Tracker",
  description: "Turn protocols into daily habits. Customize everything, track it yourself or let your AI assistant manage it through the API, and share what works. Run it on our servers or your own.",
  openGraph: {
    title: "How It Works | Liberture",
    description: "A habit tracker you actually own. Protocols become habits, tracked by you or your AI assistant — self-hostable, shareable, yours.",
    url: "https://liberture.com/how-it-works",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | Liberture",
    description: "A habit tracker you actually own. Manual or AI-managed, self-hostable, yours.",
  },
}

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
