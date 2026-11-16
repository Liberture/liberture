import { beforeEach, describe, expect, it, vi } from "vitest"
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server"
import nextConfig from "@/next.config.mjs"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { isIndexableHost, NON_INDEXABLE_ROBOTS } from "../indexing.mjs"

const request = vi.hoisted(() => ({ headers: new Headers(), query: vi.fn() }))
vi.mock("next/headers", () => ({ headers: async () => request.headers }))
vi.mock("@/lib/prisma", () => ({ prisma: new Proxy({}, { get: () => ({ findMany: request.query }) }) }))
vi.mock("@/lib/i18n/entity-slugs.server", () => ({ getEntitySlugMap: async () => new Map() }))

beforeEach(() => {
  request.headers = new Headers()
  request.query.mockReset().mockResolvedValue([])
})

describe("canonical-host search indexing", () => {
  it("allows only the main public host, regardless of production build mode", () => {
    expect(isIndexableHost("liberture.com")).toBe(true)
    for (const host of [null, undefined, "", "localhost:3000", "127.0.0.1:3022", "liberture-habits.fabriok.ar", "www.liberture.com", "liberture.com.example.org", "liberture.com:3022"]) {
      expect(isIndexableHost(host)).toBe(false)
    }
    expect(NON_INDEXABLE_ROBOTS).toEqual({ index: false, follow: false, googleBot: { index: false, follow: false } })
  })

  it("adds noindex headers to preview pages, endpoints, assets, and redirects", async () => {
    for (const path of ["/", "/es/desafios", "/articles/example", "/api/health", "/robots.txt", "/sitemap.xml", "/og/challenges.png", "/_next/static/example.js", "/knowledge"]) {
      const response = await unstable_getResponseFromNextConfig({
        url: "https://liberture-habits.fabriok.ar" + path,
        nextConfig,
        headers: { host: "liberture-habits.fabriok.ar", "x-forwarded-host": "liberture.com" },
      })
      expect(response.headers.get("x-robots-tag"), path).toBe("noindex, nofollow")
    }
  })

  it("keeps main-host responses indexable and preserves security headers", async () => {
    const response = await unstable_getResponseFromNextConfig({
      url: "https://liberture.com/challenges", nextConfig, headers: { host: "liberture.com" },
    })
    expect(response.headers.get("x-robots-tag")).toBeNull()
    expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  })

  it("blocks preview crawling and omits sitemap advertising", async () => {
    request.headers.set("host", "liberture-habits.fabriok.ar")
    expect(await robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } })
    expect(await sitemap()).toEqual([])
    expect(request.query).not.toHaveBeenCalled()
  })

  it("keeps the main site's robots rules and localized sitemap", async () => {
    request.headers.set("host", "liberture.com")
    const rules = await robots()
    expect(rules.sitemap).toBe("https://liberture.com/sitemap.xml")
    expect(rules.rules).toEqual(expect.arrayContaining([expect.objectContaining({ userAgent: "*", allow: "/", disallow: expect.arrayContaining(["/tracker", "/admin"]) })]))
    const entries = await sitemap()
    expect(entries.some(entry => entry.url === "https://liberture.com/challenges")).toBe(true)
    expect(entries.some(entry => entry.url === "https://liberture.com/es/desafios")).toBe(true)
  })

  it("fails closed when the request host is absent", async () => {
    expect(await robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } })
    expect(await sitemap()).toEqual([])
  })
})
