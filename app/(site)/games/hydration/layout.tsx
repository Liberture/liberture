import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Learn to Drink Water | Hydration Game | Liberture",
  description: "Master hydration with proper water quality and food-based water intake. Learn about electrolytes, mineral water, and how food provides 20-30% of daily water intake.",
  openGraph: {
    title: "Learn to Drink Water | Liberture",
    description: "Master hydration through an interactive simulation. Learn about water quality, electrolytes, and food-based hydration.",
    url: "https://liberture.com/games/hydration",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn to Drink Water | Liberture",
    description: "Master hydration through an interactive simulation.",
  },
}

export default function HydrationGameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
