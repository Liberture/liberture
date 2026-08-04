import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Your Tracker",
  description: "Your daily habits, streaks and completion rates.",
  // A personal, client-state-only view — nothing here is useful in an index.
  robots: {
    index: false,
    follow: true,
  },
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
