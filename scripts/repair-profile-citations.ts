import { createHash } from "node:crypto"
import { PrismaClient } from "@prisma/client"
import biographies from "../data/profile-biographies.json"
import repairs from "../data/profile-citation-repairs.json"
import { withDirectoryEdit } from "../lib/directory/revisions"

const db = new PrismaClient()
const apply = process.argv.includes("--apply")
const fields = ["bio", "achievements", "publications", "speakingEvents"] as const

async function main() {
  let count = 0
  for (const [slug, checksums] of Object.entries(repairs)) {
    const person = await db.person.findUnique({ where: { slug } })
    if (!person) continue
    const original: Record<string, string> = {}
    const changes: Record<string, string> = {}
    for (const field of fields) {
      const value = person[field]
      if (!value || !(field in checksums)) continue
      // Only change the reviewed text. Newer editorial changes take precedence.
      if (createHash("sha256").update(value).digest("hex") !== Reflect.get(checksums, field)) continue
      original[field] = value
      if (field === "bio" && (slug === "ram-dass" || slug === "bryan-johnson" || slug === "wim-hof")) {
        changes[field] = biographies[slug].bio
      } else {
        changes[field] = value.replace(/\[\d+\]/g, "")
      }
    }
    if (!Object.keys(changes).length) continue
    if (apply) {
      const changed = await withDirectoryEdit(db, { actor: "profile-citation-repair", source: "ai" },
        tx => tx.person.updateMany({ where: { id: person.id, ...original }, data: { ...changes, updatedAt: new Date() } }))
      count += changed.count
    } else count++
  }
  console.log(`${apply ? "Updated" : "Would update"} ${count} profiles.`)
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => db.$disconnect())
