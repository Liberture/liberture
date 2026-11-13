import { getDb } from "@/lib/habits/db"
import type { Locale } from "@/lib/translations"

const tables = {
  articles: "KnowledgeArticle", books: "Book", content: "Content", organizations: "Organization",
  people: "Person", projects: "Organization", protocols: "Protocol",
} as const

export async function lookupEntitySlug(section: string, slug: string, from: Locale, to: Locale): Promise<string | null> {
  if (!process.env.DATABASE_URL || !Object.hasOwn(tables, section)) return null
  const sql = getDb()
  const table = tables[section as keyof typeof tables]
  const english = sql(section === "content" ? "id" : "slug")
  const spanish = sql`localized->'es'->>'slug'`
  const kind = section === "projects" ? "project" : "organization"
  const filter = table === "Organization" ? sql`AND "directoryKind" = ${kind}`
    : table === "Protocol" ? sql`AND published` : sql``
  const [record] = await sql`SELECT ${to === "es" ? spanish : english} AS slug FROM ${sql(table)}
    WHERE ${from === "es" ? spanish : english} = ${slug} ${filter} LIMIT 1`.catch(handleUnavailable)
  return record?.slug ?? null
}

async function readSlugMap(): Promise<Map<string, string>> {
  const sql = getDb()
  const rows = await Promise.all(Object.entries(tables).map(async ([section, table]) => {
    const filter = table === "Organization" ? sql`AND "directoryKind" = ${section === "projects" ? "project" : "organization"}`
      : table === "Protocol" ? sql`AND published` : sql``
    const records = await sql`SELECT ${sql(section === "content" ? "id" : "slug")} AS original, localized->'es'->>'slug' AS translated
      FROM ${sql(table)} WHERE localized->'es'->>'slug' IS NOT NULL ${filter}`
    return records.map(row => [`/${section}/${row.original}`, row.translated] as [string, string])
  }))
  return new Map(rows.flat())
}

function handleUnavailable(error: {code?: string}): never[] {
  if (["42703", "42P01", "ECONNREFUSED", "CONNECT_TIMEOUT", "ENOTFOUND"].includes(error.code ?? "")) return []
  throw error
}

let cached: {expires: number; rows: Promise<Map<string, string>>} | undefined

export function getEntitySlugMap(): Promise<Map<string, string>> {
  if (!process.env.DATABASE_URL) return Promise.resolve(new Map())
  if (!cached || cached.expires <= Date.now()) {
    const rows = readSlugMap().catch(error => {
      cached = undefined
      handleUnavailable(error)
      return new Map<string, string>()
    })
    cached = {expires: Date.now() + 60_000, rows}
  }
  return cached.rows
}
