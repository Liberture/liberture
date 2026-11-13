import { getTranslations } from "next-intl/server"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { translatedAlternates } from "./translated-routes"

export async function docsMetadata(section: "overview" | "chatgpt" | "claude" | "permissions" | "updates" | "api") {
  const [locale, t] = await Promise.all([getRequestLocale(), getTranslations("habits.docs." + section)])
  const title = t("title")
  const description = t("lead")
  const alternates = translatedAlternates(section === "overview" ? "/docs" : "/docs/" + section, locale)
  return {
    title, description, alternates,
    openGraph: { title, description, url: alternates.canonical, images: ["/og-image.jpg"] },
    twitter: { card: "summary_large_image" as const, title, description, images: ["/og-image.jpg"] },
  }
}
