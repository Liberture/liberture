import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Reset account against a fake postgres.js: records every statement so the
 * test can check what was deleted and what the blob became, without a DB.
 */

const calls: { text: string; values: unknown[] }[] = []
let existingTables: string[] = []
let userRow: { id: number } | undefined = { id: 42 }

function makeSql() {
  const tag = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
    // tx(table) — postgres.js identifier helper.
    if (typeof strings === "string") return { identifier: strings }
    const text = strings.reduce((acc, part, i) => {
      const value = values[i - 1] as { identifier?: string } | undefined
      return acc + (value && typeof value === "object" && "identifier" in value ? value.identifier : "$") + part
    })
    calls.push({ text: text.replace(/\s+/g, " ").trim(), values })
    if (text.includes("SELECT id FROM habit_users")) return Promise.resolve(userRow ? [userRow] : [])
    if (text.includes("to_regclass")) return Promise.resolve(existingTables.map((name) => ({ name })))
    return Promise.resolve([])
  }
  return Object.assign(tag, {
    begin: async (fn: (tx: typeof tag) => Promise<void>) => fn(tag),
  })
}

vi.mock("@/lib/habits/db", () => ({ getDb: () => makeSql() }))
vi.mock("@/lib/habits/local-storage", () => ({
  isLocalStorageMode: () => false,
  getLocalUser: vi.fn(),
  updateLocalUser: vi.fn(),
}))

import { resetAccount, resetStorageData } from "@/lib/habits/account-reset"

beforeEach(() => {
  calls.length = 0
  userRow = { id: 42 }
  existingTables = [
    "habit_completions",
    "habit_todos",
    "habit_projects",
    "habit_coach_messages",
    "habit_push_subscriptions",
    "habit_notifications_sent",
    "habit_api_connections",
    "habit_oauth_codes",
  ]
})

describe("resetStorageData", () => {
  it("is a brand-new account stamped with resetAt and no assistant credentials", () => {
    const data = resetStorageData("2026-10-09T20:00:00.000Z")
    expect(data.resetAt).toBe("2026-10-09T20:00:00.000Z")
    expect(data.lastUpdated).toBe("2026-10-09T20:00:00.000Z")
    expect(data.habits).toEqual([])
    expect(data.completions).toEqual([])
    expect(data.todos).toEqual([])
    expect(data.projects).toEqual([])
    expect(data.calendarEvents).toEqual([])
    expect(data.onboarding?.completed).toBe(false)
    expect(data.preferences).toBeUndefined()
    expect(data.coachRecommendations).toBeUndefined()
    expect(data).not.toHaveProperty("integrationToken")
    expect(data).not.toHaveProperty("integrationPermissions")
  })
})

describe("resetAccount", () => {
  it("empties every per-user table and rewrites the blob, keeping the user row", async () => {
    const data = await resetAccount({ type: "nostr", pubkey: "ABCDEF" })
    expect(data?.resetAt).toBeTruthy()

    const lookup = calls.find((c) => c.text.includes("SELECT id FROM habit_users"))
    expect(lookup?.values).toEqual(["abcdef"]) // pubkeys are stored lowercase

    const deletes = calls.filter((c) => c.text.startsWith("DELETE FROM"))
    expect(deletes.map((c) => c.text.split(" ")[2])).toEqual(existingTables)
    expect(deletes.every((c) => c.values.at(-1) === 42)).toBe(true)

    const update = calls.find((c) => c.text.startsWith("UPDATE habit_users"))
    expect(JSON.parse(update!.values[0] as string)).toMatchObject({ habits: [], resetAt: data!.resetAt })
    expect(calls.some((c) => c.text.includes("DELETE FROM habit_users"))).toBe(false)
  })

  it("skips tables that were never created", async () => {
    existingTables = ["habit_completions", "habit_todos"]
    await resetAccount({ type: "api-key", apiKey: "ht_x" })
    const deletes = calls.filter((c) => c.text.startsWith("DELETE FROM")).map((c) => c.text.split(" ")[2])
    expect(deletes).toEqual(["habit_completions", "habit_todos"])
  })

  it("returns null and changes nothing for an unknown account", async () => {
    userRow = undefined
    expect(await resetAccount({ type: "api-key", apiKey: "ht_missing" })).toBeNull()
    expect(calls.some((c) => c.text.startsWith("DELETE") || c.text.startsWith("UPDATE"))).toBe(false)
  })
})
