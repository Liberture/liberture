import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const people = await prisma.person.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        pillars: true,
        twitter: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(people)
  } catch (error) {
    console.error("Error fetching people:", error)
    return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 })
  }
}
