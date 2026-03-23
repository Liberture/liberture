import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isAdmin } from "@/lib/auth";

// GET — Fetch recent content (admin only for now)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdmin(user.userId))) {
      return NextResponse.json({ content: [] });
    }

    // Fetch recent content across types
    const [protocols, articles] = await Promise.all([
      prisma.protocol.findMany({
        select: {
          id: true,
          name: true,
          pillar: true,
          published: true,
          slug: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.knowledgeArticle.findMany({
        select: {
          id: true,
          title: true,
          pillar: true,
          slug: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    const content = [
      ...protocols.map((p) => ({
        id: p.id,
        title: p.name,
        type: "protocol" as const,
        pillar: p.pillar,
        published: p.published,
        slug: p.slug,
      })),
      ...articles.map((a) => ({
        id: a.id,
        title: a.title,
        type: "article" as const,
        pillar: a.pillar,
        published: true,
        slug: a.slug,
      })),
    ];

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to load content:", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}
