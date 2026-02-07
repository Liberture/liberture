import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const article = await prisma.knowledgeArticle.update({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.knowledgeArticle.delete({
      where: { id: params.id },
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
