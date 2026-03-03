import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { fetchPeople } from "@/lib/nostr-reader"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const pillar = request.nextUrl.searchParams.get("pillar") || undefined
  
  try {
    // Try Nostr first
    const nostrPeople = await fetchPeople({ pillar, limit: 100 })
    
    if (nostrPeople.length > 0) {
      const people = nostrPeople.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        bio: p.bio,
        pillars: p.pillars.join(", "),
        twitter: p.twitter,
        image: p.image,
        website: p.website,
        source: "nostr",
      }))
      return NextResponse.json({ people })
    }
    
    // Fallback to database
    const dbPeople = await prisma.person.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        pillars: true,
        twitter: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ people: dbPeople.map(p => ({ ...p, source: "database" })) })
  } catch (error) {
    console.error("Error fetching people:", error)
    return NextResponse.json({ people: [] })
  }
}
