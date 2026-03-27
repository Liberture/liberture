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
    const { name, bio, pillars, imageUrl, website } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let slug = slugify(name)
    const existing = await prisma.person.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now().toString(36)}`

    const person = await prisma.person.create({
      data: {
        id: randomUUID(),
        name,
        bio: bio || "",
        pillars: pillars || "mind",
        slug,
        title: "",
        expertise: "",
        imageUrl: imageUrl || null,
        website: website || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ people: [person] })
  } catch (error) {
    console.error("Error creating person:", error)
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const influencers = searchParams.get('influencers')

    // Influencers filtered view (requires migration to add influencerRank column)
    if (influencers === 'true') {
      try {
        const dbPeople = await prisma.person.findMany({
          where: { influencerRank: { not: null } },
          orderBy: { influencerRank: "asc" },
        })
        return NextResponse.json({ people: dbPeople })
      } catch {
        // Column doesn't exist yet — return all people as fallback
      }
    }

    const dbPeople = await prisma.person.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        pillars: true,
        twitter: true,
        imageUrl: true,
        website: true,
        wikipedia: true,
        publications: true,
        speakingEvents: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ people: dbPeople })
  } catch (error) {
    console.error("Error fetching people:", error)
    return NextResponse.json({ people: [] })
  }
}
