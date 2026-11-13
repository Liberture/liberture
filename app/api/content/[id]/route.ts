import { NextResponse } from 'next/server'
import { getContent } from '@/lib/seo/public-records'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getContent(id)
    return item ? NextResponse.json(item) : NextResponse.json({error:'Content not found'}, {status:404})
  } catch (error) {
    console.error('Content detail API error:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
