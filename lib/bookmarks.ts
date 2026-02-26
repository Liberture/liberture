import { prisma } from '@/lib/prisma'

interface BookmarkWithEntity {
  id: string
  entityType: string
  entityId: string
  createdAt: Date
  entity: Record<string, unknown>
}

export async function getBookmarksWithEntities(
  userId: string
): Promise<Record<string, BookmarkWithEntity[]>> {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // Group by entity type
  const grouped: Record<string, typeof bookmarks> = {}
  for (const b of bookmarks) {
    if (!grouped[b.entityType]) grouped[b.entityType] = []
    grouped[b.entityType].push(b)
  }

  const result: Record<string, BookmarkWithEntity[]> = {}

  for (const [type, items] of Object.entries(grouped)) {
    const ids = items.map((i) => i.entityId)
    let entities: Record<string, unknown>[] = []

    switch (type) {
      case 'book':
        entities = await prisma.book.findMany({ where: { id: { in: ids } } })
        break
      case 'article':
        entities = await prisma.knowledgeArticle.findMany({ where: { id: { in: ids } } })
        break
      case 'person':
        entities = await prisma.person.findMany({ where: { id: { in: ids } } })
        break
      case 'protocol':
        entities = await prisma.protocol.findMany({ where: { id: { in: ids } } })
        break
      case 'organization':
        entities = await prisma.organization.findMany({ where: { id: { in: ids } } })
        break
      case 'marketplace':
        entities = await prisma.marketplaceItem.findMany({ where: { id: { in: ids } } })
        break
    }

    const entityMap = new Map(
      entities.map((e) => [(e as { id: string }).id, e])
    )

    result[type] = items
      .map((b) => ({
        ...b,
        entity: entityMap.get(b.entityId) as Record<string, unknown>,
      }))
      .filter((b) => b.entity)
  }

  return result
}
