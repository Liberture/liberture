import type { Locale } from "@/lib/translations"
import { localizedPath } from "./paths"
import { getEntitySlugMap } from "./entity-slugs.server"

/** Resolve structured-data links with the same entity slugs used by navigation. */
export async function localizedPageUrl(path: string, locale: Locale) {
  const slugs = locale === "es" ? await getEntitySlugMap() : undefined
  return new URL(localizedPath(path, locale, slugs?.get(path)), "https://liberture.com").href
}
