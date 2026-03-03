import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { fetchProtocols } from "@/lib/nostr-reader"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const pillar = request.nextUrl.searchParams.get("pillar") || undefined
  
  try {
    // Try Nostr first
    const nostrProtocols = await fetchProtocols({ pillar, limit: 100 })
    
    if (nostrProtocols.length > 0) {
      // Transform to match expected format
      const protocols = nostrProtocols.map(p => ({
        id: p.id,
        name: p.title,
        slug: p.slug,
        description: p.summary || p.content.slice(0, 200),
        pillar: p.pillar,
        difficulty: p.difficulty,
        image: p.image,
        tags: p.tags,
        source: "nostr",
      }))
      return NextResponse.json(protocols)
    }
    
    // Fallback to database
    const dbProtocols = await prisma.protocol.findMany({
      where: { 
        published: true,
        ...(pillar && { pillar }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pillar: true,
        difficulty: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(dbProtocols.map(p => ({ ...p, source: "database" })))
  } catch (error) {
    console.error("Error fetching protocols:", error)
    return NextResponse.json([])
  }
}
