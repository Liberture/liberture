import { NextRequest, NextResponse } from "next/server"
import { hasTranslatedContent } from "@/lib/seo/translated-routes"

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.delete("x-liberture-page-language")
  const { pathname, searchParams } = request.nextUrl
  const language = searchParams.get("lang")
  if (hasTranslatedContent(pathname) && (language === "en" || language === "es")) {
    headers.set("x-liberture-page-language", language)
  }
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
