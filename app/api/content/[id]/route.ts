import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.content.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Parse JSON fields
    const parsedItem = {
      ...item,
      author: JSON.parse(item.author),
      tags: JSON.parse(item.tags),
      outcomes: JSON.parse(item.outcomes),
      prerequisites: item.prerequisites ? JSON.parse(item.prerequisites) : [],
      bioScores: JSON.parse(item.bioScores),
      socialLinks: item.socialLinks ? JSON.parse(item.socialLinks) : {},
      updates: item.updates ? JSON.parse(item.updates) : [],
      relatedContent: item.relatedContent ? JSON.parse(item.relatedContent) : [],
    }

    return NextResponse.json(parsedItem)
  } catch (error) {
    console.error('Content detail API error:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
