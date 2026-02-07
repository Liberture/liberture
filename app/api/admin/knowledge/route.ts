import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const article = await prisma.knowledgeArticle.create({
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
    console.error("Failed to create knowledge article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
