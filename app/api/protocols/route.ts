import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const protocols = await prisma.protocol.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pillar: true,
        difficulty: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(protocols)
  } catch (error) {
    console.error("Error fetching protocols:", error)
    return NextResponse.json({ error: "Failed to fetch protocols" }, { status: 500 })
  }
}
