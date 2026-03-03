import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { fetchOrganizations } from "@/lib/nostr-reader"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const pillar = request.nextUrl.searchParams.get("pillar") || undefined
  
  try {
    // Try Nostr first
    const nostrOrgs = await fetchOrganizations({ pillar, limit: 100 })
    
    if (nostrOrgs.length > 0) {
      const organizations = nostrOrgs.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        description: o.description,
        pillars: o.pillars.join(", "),
        website: o.website,
        logo: o.logo,
        category: o.category,
        source: "nostr",
      }))
      return NextResponse.json({ organizations })
    }
    
    // Fallback to database
    const dbOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pillars: true,
        website: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ organizations: dbOrgs.map(o => ({ ...o, source: "database" })) })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ organizations: [] })
  }
}
