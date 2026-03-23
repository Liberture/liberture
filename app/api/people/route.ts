import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
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
