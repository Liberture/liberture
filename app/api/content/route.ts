import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pillar = searchParams.get('pillar')
    const type = searchParams.get('type')

    const items = await prisma.content.findMany({
      where: {
        ...(pillar && pillar !== 'all' ? { pillar } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: {
        rating: 'desc',
      },
    })

    // Parse JSON fields for frontend
    const parsedItems = items.map((item) => ({
      ...item,
      author: JSON.parse(item.author),
      tags: JSON.parse(item.tags),
      outcomes: JSON.parse(item.outcomes),
      prerequisites: item.prerequisites ? JSON.parse(item.prerequisites) : [],
      bioScores: JSON.parse(item.bioScores),
      socialLinks: item.socialLinks ? JSON.parse(item.socialLinks) : {},
      updates: item.updates ? JSON.parse(item.updates) : [],
      relatedContent: item.relatedContent ? JSON.parse(item.relatedContent) : [],
    }))

    return NextResponse.json({ items: parsedItems })
  } catch (error) {
    console.error('Content API error:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
