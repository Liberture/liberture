import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        pillar: data.pillar,
        tags: data.tags,
        author: data.author,
        readTime: data.readTime,
        url: data.url,
        publishedAt: new Date(data.publishedAt),
      },
    });

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error("Failed to update knowledge article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related article views first
    await prisma.articleView.deleteMany({ where: { articleId: id } });

    await prisma.knowledgeArticle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete knowledge article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
