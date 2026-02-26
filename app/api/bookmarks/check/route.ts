import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/bookmarks/check?type=book&id=abc123
export async function GET(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ bookmarked: false })
  }

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('type')
  const entityId = searchParams.get('id')

  if (!entityType || !entityId) {
    return NextResponse.json({ bookmarked: false })
  }

  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_entityType_entityId: {
        userId: authUser.userId,
        entityType,
        entityId,
      },
    },
  })

  return NextResponse.json({ bookmarked: !!bookmark })
}
