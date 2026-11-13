import { readFile } from "node:fs/promises"
import { PrismaClient } from "@prisma/client"
import { NextRequest } from "next/server"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { withDirectoryEdit } from "../revisions"

const testUrl = process.env.LIBERTURE_DIRECTORY_TEST_URL
const auth = vi.hoisted(() => ({ actor: "test-admin", admin: true }))
vi.mock("@/lib/auth", () => ({
  getAuthUser: async () => ({ userId: auth.actor }),
  isAdmin: async () => auth.admin,
}))

describe.skipIf(!testUrl)("directory edit history", () => {
  let sql: ReturnType<typeof postgres>
  let db: PrismaClient

  beforeAll(async () => {
    const target = new URL(testUrl!)
    if (!["localhost", "127.0.0.1"].includes(target.hostname) || !/^\/liberture_directory_test_[a-z0-9_]+$/.test(target.pathname)) {
      throw Error("Expected a fresh disposable local database")
    }
    process.env.DATABASE_URL = testUrl
    sql = postgres(testUrl!, { max: 2 })
    await sql.unsafe('CREATE TABLE "Person"(id text PRIMARY KEY, bio text); CREATE TABLE "Book"(id text PRIMARY KEY); CREATE TABLE "Organization"(id text PRIMARY KEY); CREATE TABLE "KnowledgeArticle"(id text PRIMARY KEY); CREATE TABLE "Protocol"(id text PRIMARY KEY)')
    await sql.unsafe(await readFile("prisma/migrations/20261113010000_directory_edit_history/migration.sql", "utf8"))
    await sql`INSERT INTO "Person" VALUES ('example','original')`
    db = (await import("@/lib/prisma")).prisma
  })

  afterAll(async () => {
    if (db) await db.$disconnect()
    if (sql) await sql.end()
  })

  it("preserves the actual change order under concurrent edits and omits no-ops", async () => {
    const update = (value: string) => withDirectoryEdit(db, { source: "ai", actor: "reviewed-bios" },
      tx => tx.$executeRaw`UPDATE "Person" SET bio=${value} WHERE id='example'`)
    await Promise.all([update("one"), update("two")])
    const final = await sql`SELECT bio FROM "Person" WHERE id='example'`
    await update(final[0].bio)
    const history = await db.directoryRevision.findMany({ orderBy: { id: "asc" } })
    expect(history).toHaveLength(2)
    const [first, second] = history.map(row => row.changes as { bio: { before: string, after: string } })
    expect(first.bio.before).toBe("original")
    expect(second.bio.before).toBe(first.bio.after)
    expect(second.bio.after).toBe(final[0].bio)
    expect(history.every(row => row.source === "ai" && row.actor === "reviewed-bios")).toBe(true)

    const { GET } = await import("@/app/api/admin/directory/[type]/[id]/history/route")
    const params = Promise.resolve({ type: "people", id: "example" })
    const request = new NextRequest("http://localhost/api/admin/directory/people/example/history")
    expect((await (await GET(request, { params })).json()).entries[0].changes).toEqual(second)
    auth.admin = false
    expect((await GET(request, { params })).status).toBe(403)
  })
})
