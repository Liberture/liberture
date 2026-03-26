import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const influencers = searchParams.get('influencers')

    // Influencers filtered view (requires migration to add influencerRank column)
    if (influencers === 'true') {
      try {
        const dbPeople = await prisma.person.findMany({
          where: { influencerRank: { not: null } },
          orderBy: { influencerRank: "asc" },
        })
        return NextResponse.json({ people: dbPeople })
      } catch {
        // Column doesn't exist yet — return all people as fallback
      }
    }

    const dbPeople = await prisma.person.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        pillars: true,
        twitter: true,
        imageUrl: true,
        website: true,
        wikipedia: true,
        publications: true,
        speakingEvents: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ people: dbPeople })
  } catch (error) {
    console.error("Error fetching people:", error)
    return NextResponse.json({ people: [] })
  }
}
