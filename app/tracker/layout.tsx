import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Tracker",
  robots: { index: false, follow: false },
}

export default function TrackerLayout({ children }: { children: ReactNode }) {
  return children
}
