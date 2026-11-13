import { getRequestConfig } from "next-intl/server"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { translations } from "@/lib/translations"
import uiEn from "@/messages/ui/en.json"
import uiEs from "@/messages/ui/es.json"

import seoEn from "@/messages/seo-en.json"
import seoEs from "@/messages/seo-es.json"

export default getRequestConfig(async () => {
  const locale = await getRequestLocale()
  const ui = locale === "es" ? uiEs : uiEn
  return { locale, messages: { ...translations[locale], ...ui, siteMetadata: locale === "es" ? seoEs : seoEn } }
})
