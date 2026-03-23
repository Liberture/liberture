import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const item = await prisma.marketplaceItem.update({
      where: { id },
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
    console.error("Failed to update marketplace item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
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

    await prisma.marketplaceItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete marketplace item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
