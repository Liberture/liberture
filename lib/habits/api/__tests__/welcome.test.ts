import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/habits/db", () => ({ getDb: () => { throw new Error("no database in unit tests") } }))

import { MAX_SHOWN, WELCOME_GUIDE, welcomeDue, welcomeNoticeFor } from "@/lib/habits/api/welcome"
import { buildSpokenSummary } from "@/lib/habits/api/assistant"
import { getPrompt } from "@/lib/habits/api/mcp-prompts"
import type { StorageData } from "@/lib/habits/types"

const now = new Date("2026-10-10T12:00:00.000Z")
const base = { connectionKey: "conn:abc", activeHabits: 4, shownCount: 0, completed: false, now }

describe("welcomeDue", () => {
  it("welcomes a connection made in the last three days", () => {
    expect(welcomeDue({ ...base, connectionCreatedAt: new Date("2026-10-09T12:00:00.000Z") })).toBe(true)
  })

  it("welcomes an older connection only while the user has no habits", () => {
    const old = new Date("2026-09-01T00:00:00.000Z")
    expect(welcomeDue({ ...base, connectionCreatedAt: old })).toBe(false)
    expect(welcomeDue({ ...base, connectionCreatedAt: old, activeHabits: 0 })).toBe(true)
  })

  it("stops once completed, or after being shown MAX_SHOWN times", () => {
    const fresh = new Date("2026-10-10T11:00:00.000Z")
    expect(welcomeDue({ ...base, connectionCreatedAt: fresh, completed: true })).toBe(false)
    expect(welcomeDue({ ...base, connectionCreatedAt: fresh, shownCount: MAX_SHOWN })).toBe(false)
  })

  it("never welcomes the script token", () => {
    expect(welcomeDue({ ...base, connectionKey: "script:7", connectionCreatedAt: null, activeHabits: 0 })).toBe(false)
  })
})

describe("welcome in get_today and the welcome prompt", () => {
  it("get_today carries the guide when given one", () => {
    const data = { habits: [], completions: [], todos: [], projects: [], calendarEvents: [], lastUpdated: "" } as unknown as StorageData
    const md = buildSpokenSummary(data, "2026-10-10", { name: null, disabledScopes: [], welcomeNotice: WELCOME_GUIDE })
    expect(md).toContain("FIRST CONVERSATION")
    expect(md).toContain("search_catalog")
    expect(md).toContain("complete_welcome")
  })

  it("never throws without a database — just no welcome", async () => {
    await expect(welcomeNoticeFor(1, "conn:abc", 0)).resolves.toBeNull()
  })

  it("the welcome prompt asks for get_today, the tour and the catalog", () => {
    const prompt = getPrompt("welcome", {})
    const text = JSON.stringify(prompt)
    expect(text).toContain("get_today")
    expect(text).toContain("search_catalog")
  })
})
