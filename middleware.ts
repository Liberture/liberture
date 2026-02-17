import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Add routes here that exist but aren't ready yet.
// Users hitting these will see a friendly "Coming Soon" page instead.
// Remove a route from this list when its page is ready.
const COMING_SOON_ROUTES: string[] = [
  // "/marketplace",
  // "/games",
  // "/protocols",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path matches any coming-soon route (exact or prefix)
  const isComingSoon = COMING_SOON_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  if (isComingSoon) {
    // Extract the top-level section name for the label
    const section = pathname.split("/").filter(Boolean)[0] || ""
    const url = request.nextUrl.clone()
    url.pathname = "/coming-soon"
    url.searchParams.set("page", section)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all routes except static files, api, and _next
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
