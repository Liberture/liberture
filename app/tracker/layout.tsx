import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import type { ReactNode } from "react"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("publicCopy.titles")
  return {
  title: t("tracker"),
  robots: { index: false, follow: false },
  }
}

export default function TrackerLayout({ children }: { children: ReactNode }) {
  return children
}
