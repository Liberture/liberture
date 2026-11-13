import { describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { localizedHref, localizedPath, parsePublicPath } from "../paths"
import { languageAlternates } from "@/lib/seo/translated-routes"
import { proxy } from "@/proxy"

vi.mock("../entity-slugs.server", () => ({
  lookupEntitySlug: async (section: string, slug: string, from: string) => {
    if (section !== "articles") return null
    if (from === "es" && slug === "entrenamiento") return "training"
    return from === "en" && slug === "training" ? "entrenamiento" : null
  },
}))

describe("public language URLs", () => {
  it("round-trips translated sections, guides and pillars", () => {
    for (const path of ["/", "/books", "/pillars/exercise", "/docs/permissions", "/guides/read-your-habit-statistics"]) {
      for (const locale of ["es", "en"] as const) {
        expect(parsePublicPath(localizedPath(path, locale))).toMatchObject({ internalPath: path, locale: locale === "es" ? "es" : undefined })
      }
    }
  })

  it("uses the same translated slug for navigation and search engines", () => {
    const slugs = new Map([["/articles/training", "entrenamiento"]])
    expect(localizedHref("/articles/training?q=x#read", "es", slugs)).toBe("/es/articulos/entrenamiento?q=x#read")
    expect(languageAlternates("/articles/training", "entrenamiento")).toEqual({
      en: "https://liberture.com/articles/training", es: "https://liberture.com/es/articulos/entrenamiento",
      "x-default": "https://liberture.com/articles/training",
    })
  })

  it("serves unprefixed English even when the browser prefers Spanish", async () => {
    const response = await proxy(new NextRequest("https://liberture.com/books", {
      headers: { "accept-language": "es", cookie: "lang=es" },
    }))
    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-request-x-liberture-page-language")).toBe("en")
  })

  it("permanently redirects old English URLs and preserves the query", async () => {
    for (const [old, path] of [["/en", "/"], ["/en/books", "/books"]]) {
      const result = await proxy(new NextRequest("https://liberture.com" + old + "?q=test"))
      expect(result.status).toBe(308)
      expect(result.headers.get("location")).toBe("https://liberture.com" + path + "?q=test")
    }
  })

  it("leaves functional endpoints and static assets untouched", () => {
    for (const path of ["/api/auth", "/admin", "/tracker", "/oauth/authorize", "/articles/images/a.webp", "//example.org"]) {
      expect(localizedHref(path, "es", new Map())).toBe(path)
    }
  })

  it("preserves legacy query parameters and switches back to the same English record", async () => {
    const spanish = await proxy(new NextRequest("https://liberture.com/articles/training?q=x&lang=es"))
    expect(spanish.headers.get("location")).toBe("https://liberture.com/es/articulos/entrenamiento?q=x")
    const english = await proxy(new NextRequest("https://liberture.com/es/articulos/entrenamiento?q=x&lang=en"))
    expect(english.headers.get("location")).toBe("https://liberture.com/articles/training?q=x")
  })

  it("serves the Spanish record at its canonical URL independently of a conflicting cookie", async () => {
    const result = await proxy(new NextRequest("https://liberture.com/es/articulos/entrenamiento", {
      headers: { cookie: "lang=en" },
    }))
    expect(result.headers.get("x-middleware-rewrite")).toBe("https://liberture.com/articles/training")
    expect(result.headers.get("x-middleware-request-x-liberture-page-language")).toBe("es")
  })
})
