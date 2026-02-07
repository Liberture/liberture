import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { role } = await request.json();

    if (!["user", "admin", "moderator"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
