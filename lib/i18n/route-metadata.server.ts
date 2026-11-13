import { headers } from "next/headers"
import { translatedAlternates } from "@/lib/seo/translated-routes"
import { isLocale } from "@/lib/habits/i18n"

export async function currentPageAlternates() {
  const request = await headers()
  const path = request.get("x-liberture-internal-path")
  const locale = request.get("x-liberture-page-language")
  if (!path || !isLocale(locale)) return undefined
  return translatedAlternates(path, locale, request.get("x-liberture-spanish-slug") ?? undefined)
}
