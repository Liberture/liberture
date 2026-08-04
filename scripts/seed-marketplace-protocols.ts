/**
 * Seed the protocol library with a cross-linked, evidence-referenced starter set.
 * 2 protocols per pillar (canonical frontend pillar ids), each with a "why",
 * real reference sources, and relations (synergy / alternative) to other protocols.
 * Idempotent: upserts by slug; relations are skipped unless both ends exist.
 *
 * Run: pnpm exec tsx scripts/seed-marketplace-protocols.ts
 */
import { PrismaClient } from "@prisma/client"
import { protocols, relations } from "../lib/protocols/library"

const prisma = new PrismaClient()
async function main() {
  let created = 0
  let updated = 0
  for (const p of protocols) {
    const data = {
      name: p.name,
      description: p.description,
      why: p.why,
      pillar: p.pillar,
      creator: p.creator,
      duration: p.duration,
      difficulty: p.difficulty,
      steps: JSON.stringify(p.steps),
      benefits: JSON.stringify(p.benefits),
      risks: p.risks?.length ? JSON.stringify(p.risks) : null,
      equipment: p.equipment?.length ? JSON.stringify(p.equipment) : null,
      references: JSON.stringify(p.references),
      featured: p.featured ?? false,
      published: true,
    }
    const existing = await prisma.protocol.findUnique({ where: { slug: p.slug } })
    await prisma.protocol.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    })
    existing ? updated++ : created++
  }
  console.log(`Protocols: ${created} created, ${updated} updated`)

  let relCreated = 0
  let relSkipped = 0
  for (const r of relations) {
    const [from, to] = await Promise.all([
      prisma.protocol.findUnique({ where: { slug: r.from }, select: { slug: true } }),
      prisma.protocol.findUnique({ where: { slug: r.to }, select: { slug: true } }),
    ])
    if (!from || !to) {
      relSkipped++
      continue
    }
    await prisma.protocolRelation.upsert({
      where: { fromSlug_toSlug_kind: { fromSlug: r.from, toSlug: r.to, kind: r.kind } },
      update: { note: r.note },
      create: { fromSlug: r.from, toSlug: r.to, kind: r.kind, note: r.note },
    })
    relCreated++
  }
  console.log(`Relations: ${relCreated} upserted, ${relSkipped} skipped (missing endpoint)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
