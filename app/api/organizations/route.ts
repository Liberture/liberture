import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const dbOrgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pillars: true,
        website: true,
        imageUrl: true,
        wikipedia: true,
        publications: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ organizations: dbOrgs })
  } catch (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ organizations: [] })
  }
}
