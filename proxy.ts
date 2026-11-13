import { NextRequest, NextResponse } from "next/server"
import { localizedPath, parsePublicPath, entitySections } from "@/lib/i18n/paths"
import { lookupEntitySlug } from "@/lib/i18n/entity-slugs.server"
import { isLocale, LOCALE_COOKIE, resolveLocale } from "@/lib/habits/i18n"

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.delete("x-liberture-page-language")
  headers.delete("x-liberture-internal-path")
  headers.delete("x-liberture-spanish-slug")

  const url = new URL(request.url)
  const route = parsePublicPath(url.pathname)
  if (!route) return NextResponse.next({ request: { headers } })

  const requested = url.searchParams.get("lang")
  const locale = isLocale(requested) ? requested : route.locale ?? resolveLocale(
    request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language")
  )
  let path = route.internalPath
  let spanishSlug: string | undefined
  if (route.slug && entitySections.has(route.section)) {
    if (route.locale === "es") {
      const original = await lookupEntitySlug(route.section, route.slug, "es", "en")
      if (original) {
        path = "/" + route.section + "/" + original
        spanishSlug = route.slug
      }
    }
    spanishSlug ??= await lookupEntitySlug(route.section, route.slug, "en", "es") ?? undefined
  }
  const destination = localizedPath(path, locale, spanishSlug)
  if (url.pathname !== destination || url.searchParams.has("lang")) {
    url.pathname = destination
    url.searchParams.delete("lang")
    const response = NextResponse.redirect(url)
    // Unprefixed paths vary by visitor preference. Never share these redirects through a public cache.
    response.headers.set("Cache-Control", "private, no-store")
    return response
  }
  headers.set("x-liberture-page-language", locale)
  headers.set("x-liberture-internal-path", path)
  if (spanishSlug) headers.set("x-liberture-spanish-slug", spanishSlug)
  url.pathname = path
  return NextResponse.rewrite(url, { request: { headers } })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
