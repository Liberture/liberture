import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser, isAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const data = await request.json();

    const item = await prisma.marketplaceItem.create({
      data: {
        id: randomUUID(),
        slug: data.slug || `${slugify(String(data.title ?? ""))}-${randomUUID().slice(0, 8)}`,
        title: data.title,
        description: data.description,
        pillar: data.pillar,
        type: data.type,
        author: data.author,
        rating: data.rating,
        reviews: data.reviews,
        price: data.price,
        duration: data.duration,
        color: data.color,
        iconColor: data.iconColor,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Failed to create marketplace item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
