import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Delete account against a fake postgres.js: records every statement so the
 * test can check what was deleted, without a DB.
 */

const calls: { text: string; values: unknown[] }[] = []
let existingTables: string[] = []
let userRow: { id: number; nostr_pubkey: string | null } | undefined

function makeSql() {
  const tag = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
    // tx(table) — postgres.js identifier helper.
    if (typeof strings === "string") return { identifier: strings }
    const text = strings.reduce((acc, part, i) => {
      const value = values[i - 1] as { identifier?: string } | undefined
      return acc + (value && typeof value === "object" && "identifier" in value ? value.identifier : "$") + part
    })
    calls.push({ text: text.replace(/\s+/g, " ").trim(), values })
    if (text.includes("FROM habit_users WHERE")) return Promise.resolve(userRow ? [userRow] : [])
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
  deleteLocalUser: vi.fn(),
}))

import { USER_TABLES, deleteAccount } from "@/lib/habits/account-delete"

const deletes = () => calls.filter((c) => c.text.startsWith("DELETE FROM"))

beforeEach(() => {
  calls.length = 0
  userRow = { id: 42, nostr_pubkey: "abcdef" }
  existingTables = [...USER_TABLES, "nostr_sessions"]
})

describe("deleteAccount", () => {
  it("deletes every per-user table, the sessions, then the account itself", async () => {
    expect(await deleteAccount({ type: "nostr", pubkey: "ABCDEF" })).toBe(true)

    const lookup = calls.find((c) => c.text.includes("FROM habit_users WHERE"))
    expect(lookup?.values).toEqual(["abcdef"]) // pubkeys are stored lowercase

    const tables = deletes().map((c) => c.text.split(" ")[2])
    expect(tables).toEqual([...USER_TABLES, "nostr_sessions", "habit_users"])
    const sessions = deletes().find((c) => c.text.startsWith("DELETE FROM nostr_sessions"))
    expect(sessions?.values).toEqual(["abcdef"])
    // The account row goes last, after everything that points at it.
    expect(deletes().at(-1)?.text).toBe("DELETE FROM habit_users WHERE id = $")
    expect(deletes().at(-1)?.values).toEqual([42])
  })

  it("skips tables that were never created", async () => {
    existingTables = ["habit_completions", "habit_todos"]
    userRow = { id: 7, nostr_pubkey: null }
    await deleteAccount({ type: "api-key", apiKey: "ht_x" })
    expect(deletes().map((c) => c.text.split(" ")[2])).toEqual(["habit_completions", "habit_todos", "habit_users"])
  })

  it("returns false and deletes nothing for an unknown account", async () => {
    userRow = undefined
    expect(await deleteAccount({ type: "api-key", apiKey: "ht_missing" })).toBe(false)
    expect(deletes()).toEqual([])
  })
})
