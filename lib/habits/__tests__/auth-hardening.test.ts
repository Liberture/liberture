import { describe, expect, it, vi } from "vitest"

/**
 * Regressions for the 2026-10-11 auth review: a Nostr account's internal
 * api_key (once `npub_<16 hex of the public key>`) must never authenticate.
 */

const queries: string[] = []
vi.mock("@/lib/habits/db", () => ({
  getDb: () => (strings: TemplateStringsArray) => {
    queries.push(strings.join("$"))
    return Promise.resolve([])
  },
}))
vi.mock("@/lib/habits/local-storage", () => ({ isLocalStorageMode: () => false, getLocalUser: vi.fn() }))

import { POST as importStorage } from "@/app/api/storage/import/route"
import { POST as verify } from "@/app/api/auth/verify/route"
import { randomInternalApiKey } from "@/lib/habits/internal-api-key"

const pubkey = "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"
const derived = `npub_${pubkey.slice(0, 16)}`

describe("POST /api/storage/import", () => {
  it("rejects the derived key (the attack): 401 before touching any account", async () => {
    queries.length = 0
    const response = await importStorage(
      new Request("https://liberture.test/api/storage/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${derived}`, "Content-Type": "application/json" },
        body: JSON.stringify({ habits: [] }),
      })
    )
    expect(response.status).toBe(401)
    expect(queries.some((q) => q.includes("UPDATE habit_users"))).toBe(false)
  })

  it("rejects a request with no credentials", async () => {
    const response = await importStorage(new Request("https://liberture.test/api/storage/import", { method: "POST", body: "{}" }))
    expect(response.status).toBe(401)
  })
})

describe("POST /api/auth/verify", () => {
  const call = (body: unknown) =>
    verify(new Request("https://liberture.test/api/auth/verify", { method: "POST", body: JSON.stringify(body) }))

  it("refuses anything that isn't a real ht_ key", async () => {
    expect((await call({ apiKey: derived })).status).toBe(400)
    expect((await call({ apiKey: "nostr_abc" })).status).toBe(400)
  })

  it("no longer answers whether a pubkey has an account", async () => {
    expect((await call({ pubkey })).status).toBe(400)
  })
})

describe("randomInternalApiKey", () => {
  it("is random, long, and not usable as a credential prefix", () => {
    const a = randomInternalApiKey()
    const b = randomInternalApiKey()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^nostr_[0-9a-f]{64}$/)
    expect(a.startsWith("ht_")).toBe(false)
    expect(a).not.toContain(pubkey.slice(0, 16))
  })
})
