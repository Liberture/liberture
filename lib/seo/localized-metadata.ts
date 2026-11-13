import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { translatedAlternates } from "./translated-routes"

export async function docsMetadata(section: "overview" | "chatgpt" | "claude" | "permissions" | "updates" | "api") {
  const locale = await getRequestLocale()
  const page = getDictionary(locale).docs[section]
  return { title: page.title, description: page.lead, alternates: translatedAlternates(section === "overview" ? "/docs" : "/docs/" + section, locale) }
}
