import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { translatedAlternates } from "./translated-routes"

export async function publicPageMetadata(path: string, key: keyof typeof import("@/messages/ui/en.json")["publicCopy"]["metadata"]): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("publicCopy.metadata")])
  const title = t(`${key}.title`)
  const description = t(`${key}.description`)
  const alternates = translatedAlternates(path, locale)
  const images = ["/og-image.jpg"]
  return {
    title, description, alternates,
    openGraph: { type: "website", siteName: "Liberture", url: alternates.canonical, locale: locale === "es" ? "es_ES" : "en_US", title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  }
}
