import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.user.update({
      where: { id: params.id },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unban user:", error);
    return NextResponse.json(
      { error: "Failed to unban user" },
      { status: 500 }
    );
  }
}
