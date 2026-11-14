import { PrismaClient } from "@prisma/client"
import { withDirectoryEdit } from "../lib/directory/revisions"
import records from "../content/editorial/royal-flush/records.json"
export async function importRoyalFlush(db: PrismaClient) {
  await withDirectoryEdit(db, { actor: "royal-flush-editorial-import", source: "ai" }, async tx => {
    const article = await tx.article.findUnique({ where: { slug: records.article.slug } })
    const protocol = await tx.protocol.findUnique({ where: { slug: records.protocol.slug } })
    if (article || protocol) {
      if (article && protocol) { console.log("Royal Flush already exists; preserving admin edits."); return }
      throw new Error("Partial publication exists; review it instead of overwriting it")
    }
    await tx.protocol.create({ data: { ...records.protocol, pillar: "nutrition", creator: "Liberture Editorial", difficulty: "beginner", published: true } })
    await tx.article.create({ data: { ...records.article, id: crypto.randomUUID(), pillar: "nutrition", author: "Liberture Editorial", readTime: 5, url: "", publishedAt: new Date(), updatedAt: new Date() } })
  })
}
