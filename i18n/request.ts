import { protocolDurations } from "@/lib/constants/protocol-durations"
import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"
import { isLocale, LOCALE_COOKIE, resolveLocale } from "@/lib/habits/i18n"
import { translations } from "@/lib/translations"
import uiEn from "@/messages/ui/en.json"
import uiEs from "@/messages/ui/es.json"

import seoEn from "@/messages/seo-en.json"
import seoEs from "@/messages/seo-es.json"

async function resolveRequestLocale() {
  const request = await headers()
  const fromPath = request.get("x-liberture-page-language")
  if (isLocale(fromPath)) return fromPath
  const preferences = await cookies()
  return resolveLocale(preferences.get(LOCALE_COOKIE)?.value, request.get("accept-language"))
}

export default getRequestConfig(async ({ locale: override }) => {
  const locale = isLocale(override) ? override : await resolveRequestLocale()
  const ui = locale === "es" ? (uiEs satisfies typeof uiEn) : uiEn
  return { locale, messages: { ...translations[locale], ...ui, protocolDurations: protocolDurations[locale], siteMetadata: locale === "es" ? (seoEs satisfies typeof seoEn) : seoEn } }
})
