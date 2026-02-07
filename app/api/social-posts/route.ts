import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const posts = await prisma.socialPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Social posts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 })
  }
}
