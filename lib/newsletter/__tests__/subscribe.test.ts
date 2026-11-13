import { afterEach, describe, expect, it, vi } from "vitest"
const list = vi.hoisted(() => ({ findFirst: vi.fn(), createMany: vi.fn() }))
vi.mock("@/lib/prisma", () => ({ prisma: { newsletter: list } }))
import { POST } from "@/app/api/newsletter/subscribe/route"

describe("newsletter subscriptions", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks() })
  it("checks the CAPTCHA host before storing an address, preserves opt-outs, and rate limits repeated requests", async () => {
    vi.stubEnv("RECAPTCHA_SITE_KEY", "test-site")
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret")
    // The module reads its runtime configuration when loaded.
    vi.resetModules()
    const subscribe = (await import("@/app/api/newsletter/subscribe/route")).POST
    const verify = vi.fn()
    vi.stubGlobal("fetch", verify)
    function submit() {
      return subscribe(new Request("https://liberture.com/api/newsletter/subscribe", {
        method: "POST", headers: { "content-type": "application/json", origin: "https://liberture.com" },
        body: JSON.stringify({ email: " Member@example.org ", token: "response" })
      }))
    }
    verify.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, hostname: "other.example" })))
    expect((await submit()).status).toBe(403)
    expect(list.createMany).not.toHaveBeenCalled()
    verify.mockImplementation(async () => new Response(JSON.stringify({ success: true, hostname: "liberture.com" })))
    list.findFirst.mockResolvedValueOnce(null).mockResolvedValue({ id: "already-registered" })
    expect((await submit()).status).toBe(204)
    expect(list.createMany.mock.calls[0][0].data[0].email).toBe("member@example.org")
    for (let count = 0; count < 3; count++) expect((await submit()).status).toBe(204)
    expect(list.createMany).toHaveBeenCalledTimes(1)
    expect((await submit()).status).toBe(429)
  })
  it("rejects a cross-origin request before contacting Google", async () => {
    expect((await POST(new Request("https://liberture.com/api/newsletter/subscribe", {
      method: "POST", headers: { origin: "https://example.org", "content-type": "application/json" }
    }))).status).toBe(403)
  })
})
