import { readFile } from "node:fs/promises"
import { Prisma, PrismaClient } from "@prisma/client"
import { withDirectoryEdit } from "../lib/directory/revisions"

const fields = {
  Person: ["title", "bio", "summary", "expertise", "achievements", "speakingEvents"],
  Book: ["title", "description", "keyTakeaways", "forWho"],
  Protocol: ["name", "description", "why", "duration", "steps", "benefits", "risks", "equipment"],
  Organization: ["description", "resources"],
  KnowledgeArticle: ["title", "description", "content"],
  Content: ["title", "description", "duration", "outcomes", "prerequisites"],
} as const

type Entry = {table: keyof typeof fields; id: string; slug: string; fields: Record<string, string>; es: Record<string, string>}

function validate(entry: Entry) {
  if (!Object.hasOwn(fields, entry.table) || !entry.id || !entry.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.es?.slug ?? "")) {
    throw new Error("Invalid source identity or translated slug")
  }
  const allowed: readonly string[] = fields[entry.table]
  const keys = Object.keys(entry.fields)
  if (!keys.length || Object.keys(entry.es).length !== keys.length + 1 ||
      !keys.every(key => allowed.includes(key) && typeof entry.fields[key] === "string" && typeof entry.es[key] === "string" && entry.es[key].trim())) {
    throw new Error(`Incomplete translation for ${entry.table}/${entry.id}`)
  }
}

async function main() {
  const [file, mode] = process.argv.slice(2)
  if (!file || !["--check", "--apply"].includes(mode)) throw new Error("Usage: tsx scripts/import-editorial-translations.ts <file> --check|--apply")
  const entries: Entry[] = JSON.parse(await readFile(file, "utf8"))
  const seen = new Set<string>()
  for (const entry of entries) {
    validate(entry)
    const key = entry.table + "/" + entry.es.slug
    if (seen.has(key)) throw new Error(`Duplicate destination: ${key}`)
    seen.add(key)
  }
  const db = new PrismaClient()
  try {
    const changed = await withDirectoryEdit(db, {source: "ai", actor: "editorial-spanish-translation"}, async tx => {
      let changes = 0
      for (const entry of entries) {
        const table = Prisma.raw('"' + entry.table + '"')
        const [record] = await tx.$queryRaw<Record<string, unknown>[]> `SELECT * FROM ${table} WHERE id = ${entry.id} FOR UPDATE`
        // Refuse to overwrite a newer source revision or a changed source URL.
        if (!record || (record.slug ?? record.id) !== entry.slug || Object.entries(entry.fields).some(([key, value]) => record[key] !== value)) {
          throw new Error(`Source changed for ${entry.table}/${entry.id}. Refresh and translate the current record.`)
        }
        const es = JSON.stringify(entry.es)
        const [row] = await tx.$queryRaw<{differs: boolean}[]>`SELECT (localized->'es') IS DISTINCT FROM ${es}::jsonb AS differs FROM ${table} WHERE id=${entry.id}`
        if (!row.differs) continue
        changes++
        if (mode === "--apply") {
          await tx.$executeRaw`UPDATE ${table} SET localized=jsonb_set(COALESCE(localized, '{}'::jsonb), '{es}', ${es}::jsonb), "updatedAt"=now() WHERE id=${entry.id}`
        }
      }
      return changes
    }, { timeout: 120_000 })
    console.log(`${mode === "--apply" ? "Updated" : "Would update"} ${changed} of ${entries.length} editorial translations.`)
  } finally {
    await db.$disconnect()
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
