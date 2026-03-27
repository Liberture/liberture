import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { randomUUID } from "crypto"

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "")
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, pillar, difficulty, duration, steps, benefits } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    let slug = slugify(name)
    const existing = await prisma.protocol.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const protocol = await prisma.protocol.create({
      data: {
        id: randomUUID(),
        name,
        description,
        pillar: pillar || "mind",
        slug,
        difficulty: difficulty || "beginner",
        duration: duration || "",
        steps: steps || "",
        benefits: benefits || "",
        risks: "",
        published: true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ protocols: [protocol] })
  } catch (error) {
    console.error("Error creating protocol:", error)
    return NextResponse.json({ error: "Failed to create protocol" }, { status: 500 })
  }
}

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
