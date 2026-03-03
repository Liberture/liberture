import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET — Fetch content authored by the current user (by nostrPubkey)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's nostr pubkey from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { nostrPubkey: true },
    });

    if (!dbUser?.nostrPubkey) {
      return NextResponse.json({ content: [] });
    }

    // Fetch protocols authored by this pubkey
    const protocols = await prisma.protocol.findMany({
      where: { authorPubkey: dbUser.nostrPubkey },
      select: {
        id: true,
        name: true,
        pillar: true,
        published: true,
        slug: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch articles authored by this pubkey
    const articles = await prisma.knowledgeArticle.findMany({
      where: { authorPubkey: dbUser.nostrPubkey },
      select: {
        id: true,
        title: true,
        pillar: true,
        slug: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Combine and format
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
        published: true, // Articles don't have a published flag currently
        slug: a.slug,
      })),
    ];

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to load user content:", error);
    return NextResponse.json(
      { error: "Failed to load content" },
      { status: 500 }
    );
  }
}
