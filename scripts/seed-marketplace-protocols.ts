/**
 * Seed the protocol library from the habit tracker's catalog
 * (lib/habits/protocols/library), plus the cross-links in lib/protocols/library.ts.
 * Idempotent: upserts by slug; relations are skipped unless both ends exist.
 *
 * Run: pnpm exec tsx scripts/seed-marketplace-protocols.ts
 */
import { PrismaClient } from "@prisma/client"
import { CATALOG_PROTOCOLS } from "../lib/habits/protocols/catalog"
import { relations } from "../lib/protocols/library"
import { sourceLabel } from "../lib/tracker/catalog"

const SEED_DIFFICULTY = { easy: "beginner", moderate: "intermediate", hard: "advanced" } as const

const prisma = new PrismaClient()
async function main() {
  let created = 0
  let updated = 0
  for (const p of CATALOG_PROTOCOLS) {
    const data = {
      name: p.name,
      description: p.description,
      why: p.why,
      pillar: p.pillar,
      creator: p.author?.name ?? p.creator,
      duration: p.duration,
      difficulty: SEED_DIFFICULTY[p.difficulty],
      steps: JSON.stringify(p.steps),
      benefits: JSON.stringify(p.benefits),
      risks: p.risks?.length ? JSON.stringify(p.risks) : null,
      equipment: p.equipment?.length ? JSON.stringify(p.equipment) : null,
      references: JSON.stringify(p.evidence.map(sourceLabel)),
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
