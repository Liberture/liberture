import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const pillar = request.nextUrl.searchParams.get("pillar") || undefined
  const all = request.nextUrl.searchParams.get("all") === "true"

  try {
    const dbProtocols = await prisma.protocol.findMany({
      where: {
        ...(!all && { published: true }),
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

    return NextResponse.json({ protocols: dbProtocols })
  } catch (error) {
    console.error("Error fetching protocols:", error)
    return NextResponse.json({ protocols: [] })
  }
}
