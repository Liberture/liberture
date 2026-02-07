import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    const comments = await prisma.platformComment.findMany({
      where: contentId ? { contentId } : {},
      orderBy: {
        helpful: 'desc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Platform comments API error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
