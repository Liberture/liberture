import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getBookmarksWithEntities } from '@/lib/bookmarks'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const bookmarks = await getBookmarksWithEntities(authUser.userId)
    return NextResponse.json({ bookmarks })
  } catch {
    return NextResponse.json({ bookmarks: {} })
  }
}
