import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pillar = searchParams.get('pillar')
    const type = searchParams.get('type')

    const items = await prisma.marketplaceItem.findMany({
      where: {
        ...(pillar && pillar !== 'all' ? { pillar } : {}),
        ...(type && type !== 'all' ? { type } : {}),
      },
      orderBy: {
        rating: 'desc',
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Marketplace API error:', error)
    return NextResponse.json({ error: 'Failed to fetch marketplace items' }, { status: 500 })
  }
}
