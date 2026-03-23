import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const pillar = request.nextUrl.searchParams.get("pillar") || undefined

  try {
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

    return NextResponse.json(dbProtocols)
  } catch (error) {
    console.error("Error fetching protocols:", error)
    return NextResponse.json([])
  }
}
