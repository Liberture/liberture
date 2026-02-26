import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_ENTITY_TYPES = ['book', 'article', 'person', 'protocol', 'organization', 'marketplace']

// GET /api/bookmarks?type=book (optional filter)
export async function GET(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('type')

  const where: Record<string, string> = { userId: authUser.userId }
  if (entityType && VALID_ENTITY_TYPES.includes(entityType)) {
    where.entityType = entityType
  }

  const bookmarks = await prisma.bookmark.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ bookmarks })
}

// POST /api/bookmarks — { entityType, entityId }
export async function POST(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { entityType, entityId } = await request.json()

  if (!VALID_ENTITY_TYPES.includes(entityType) || !entityId) {
    return NextResponse.json({ error: 'Invalid entity type or ID' }, { status: 400 })
  }

  // Upsert to handle duplicate gracefully
  const bookmark = await prisma.bookmark.upsert({
    where: {
      userId_entityType_entityId: {
        userId: authUser.userId,
        entityType,
        entityId,
      },
    },
    update: {},
    create: {
      userId: authUser.userId,
      entityType,
      entityId,
    },
  })

  return NextResponse.json({ bookmark })
}

// DELETE /api/bookmarks — { entityType, entityId }
export async function DELETE(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { entityType, entityId } = await request.json()

  await prisma.bookmark.deleteMany({
    where: {
      userId: authUser.userId,
      entityType,
      entityId,
    },
  })

  return NextResponse.json({ success: true })
}
