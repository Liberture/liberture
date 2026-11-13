import { NextRequest, NextResponse } from "next/server"
import { localizedPath, parsePublicPath, entitySections } from "@/lib/i18n/paths"
import { lookupEntitySlug } from "@/lib/i18n/entity-slugs.server"
import { isLocale } from "@/lib/habits/i18n"

export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.delete("x-liberture-page-language")
  headers.delete("x-liberture-internal-path")
  headers.delete("x-liberture-spanish-slug")

  const url = new URL(request.url)
  headers.delete("x-liberture-private-invite")
  if (url.pathname.startsWith("/challenges/")) headers.set("x-liberture-private-invite", "1")
  const route = parsePublicPath(url.pathname)
  if (!route) return NextResponse.next({ request: { headers } })

  const requested = url.searchParams.get("lang")
  const locale = isLocale(requested) ? requested : route.locale ?? "en"
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
    if (route.locale === "en" && requested === null) return NextResponse.redirect(url, 308)
    const response = NextResponse.redirect(url)
    response.headers.set("Cache-Control", "private, no-store")
    return response
  }
  headers.set("x-liberture-page-language", locale)
  headers.set("x-liberture-internal-path", path)
  if (spanishSlug) headers.set("x-liberture-spanish-slug", spanishSlug)
  if (url.pathname === path) return NextResponse.next({ request: { headers } })
  url.pathname = path
  return NextResponse.rewrite(url, { request: { headers } })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
