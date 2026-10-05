import { cookies, headers } from "next/headers"
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./index"

/** The visitor's locale for a server component. Makes the route dynamic. */
export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get("accept-language"))
}
