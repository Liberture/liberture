import type en from "@/messages/en.json"
import type ui from "@/messages/ui/en.json"
import type seo from "@/messages/seo-en.json"
import type durations from "@/messages/durations/en.json"
import type { Locale as SiteLocale } from "@/lib/translations"

declare module "next-intl" {
  interface AppConfig {
    Locale: SiteLocale
    Messages: typeof en & typeof ui & { siteMetadata: typeof seo; protocolDurations: typeof durations }
  }
}
