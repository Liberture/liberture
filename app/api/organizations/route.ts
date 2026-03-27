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
    const { name, description, pillars, type, website, imageUrl } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    let slug = slugify(name)
    const existing = await prisma.organization.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const org = await prisma.organization.create({
      data: {
        id: randomUUID(),
        name,
        description,
        pillars: pillars || "mind",
        slug,
        type: type || "research",
        website: website || "",
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ organizations: [org] })
  } catch (error) {
    console.error("Error creating organization:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}

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
