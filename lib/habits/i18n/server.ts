import { cookies, headers } from "next/headers"
import { isLocale, LOCALE_COOKIE, resolveLocale, type Locale } from "./index"

/** The visitor's locale for a server component. Makes the route dynamic. */
export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const explicit = headerStore.get("x-liberture-page-language")
  if (isLocale(explicit)) return explicit
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get("accept-language"))
}
