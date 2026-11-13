// Run from the packaged application root with tsx lib/directory/repair-citations.ts.
import { createHash } from "node:crypto"
import { prisma } from "../prisma"
import { getDb } from "../habits/db"
import { ensureDirectoryRevisionSchema } from "./revision-schema"
import { withDirectoryEdit } from "./revisions"

// Only rewrite the reviewed editions. A later editorial change takes precedence.
const editions: Record<string, string> = {
  "5-healthy-habits-that-actually-can-quietly-raise-inflammation": "c5346f9a37939a16e7c534b1e1b07a0a0bd00bbe498a4e3e90206ece5f12407d",
  "6-gut-habits-scientists-say-can-slow-biological-aging": "296e5e4184055e6a75d16f6cae68c04a545618bff773657ec92cd128fe86d6ad",
  "can-you-learn-a-language-while-you-sleep": "612df404d8a8771713eb0d9cbe46fac601491b0ffcddfd8dc3aa5d498c2d8f25",
  "cold-showers-and-dopamine-what-the-new-brain-science-really-shows": "e9785d10a20407bf51469fda973a81622389f348fdd1728f3edc0cd4c9bd01b4",
  "how-to-improve-food-nutrition-without-supplements": "de48d4c670497380b2c5456b541a42843b9477b05bef924ce5e7cd7a359db579",
  "nk-cells-are-becoming-the-body-s-most-hackable-cancer-weapon": "b6806ab8900a10662ce2a8c2ebad583bbba6e81a77b824628904e5bdb9bf39b7",
  "playing-music-reading-and-writing-may-help-your-brain-age-more-slowly": "6df2043370726c95fb9aa4e91a3d33549f8e6167c7de9da224620ca574450667",
  "stop-bad-habits-using-neuroscience-a-biohacker-s-playbook": "1e5a00dba429f124b583f6fd5b427f38d326a92c7b24275ac2b358d07eb5d5ba",
  "wellness-trends-for-2026-5-to-follow-5-to-avoid": "0000f6e645e7c7e2d9b08533db9ab7ed3b82d7f9dfd4a8baea4b01365af06b0e",
}

function repairArticle(content: string) {
  const offset = content.search(/^## References\b/im)
  const body = offset < 0 ? content : content.slice(0, offset)
  const bibliography = offset < 0 ? "" : content.slice(offset)
  const links = new Map<string, string>()
  for (const entry of bibliography.matchAll(/^(\d+)\. \[[^\n]+?\]\((https?:\/\/[^\s)]+)\)/gm)) {
    links.set(entry[1], entry[2])
  }
  const bodyWithLinks = body.replace(/(?:\[\d+\])+/g, cluster => {
    const references: string[] = []
    for (const marker of cluster.matchAll(/\[(\d+)\]/g)) {
      const url = links.get(marker[1])
      if (url) {
        const superscript = marker[1].replace(/\d/g, digit => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)])
        references.push(`[${superscript}](${url} "Reference ${marker[1]}")`)
      }
    }
    return references.join(" ")
  })
  return bodyWithLinks + bibliography
}

async function repair() {
  await ensureDirectoryRevisionSchema()
  const counts = await withDirectoryEdit(prisma, { source: "ai", actor: "directory-citation-repair" }, async tx => {
    let articles = 0
    const skipped: string[] = []
    const rows = await tx.article.findMany({
      where: { slug: { in: Object.keys(editions) } },
      select: { id: true, slug: true, content: true },
    })
    for (const { id, slug, content } of rows) {
      if (!content || !/\[\d+\]/.test(content)) continue
      if (createHash("sha256").update(content).digest("hex") !== editions[slug]) {
        skipped.push(slug)
        continue
      }
      const result = await tx.article.updateMany({ where: { id, content }, data: { content: repairArticle(content) } })
      articles += result.count
      if (!result.count) skipped.push(slug)
    }
    const slug = "the-obesity-code"
    const book = await tx.book.findUnique({ where: { slug }, select: { description: true } })
    let books = 0
    if (book?.description.endsWith("--Page [4] of cover.")) {
      const description = book.description.replace(/--Page \[4\] of cover\.$/, " — Back cover.")
      const result = await tx.book.updateMany({ where: { slug, description: book.description }, data: { description } })
      books = result.count
      if (!books) skipped.push(slug)
    }
    return { articles, books, skipped }
  })
  console.log(JSON.stringify(counts))
}

repair().catch(error => {
  console.error(error)
  process.exitCode = 1
}).finally(async () => {
  await prisma.$disconnect()
  await getDb().end()
})
