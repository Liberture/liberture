import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const item = await prisma.marketplaceItem.create({
      data: {
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
