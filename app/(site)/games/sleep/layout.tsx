import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Learn to Sleep | Sleep Game | Liberture",
  description: "Master sleep hygiene by controlling bedtime, meals, and light exposure. Learn optimal sleep timing, meal timing, and light management for better rest.",
  openGraph: {
    title: "Learn to Sleep | Liberture",
    description: "Master sleep hygiene through an interactive simulation. Control bedtime, meal timing, and light exposure for optimal rest.",
    url: "https://liberture.com/games/sleep",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn to Sleep | Liberture",
    description: "Master sleep hygiene through an interactive simulation.",
  },
}

export default function SleepGameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
