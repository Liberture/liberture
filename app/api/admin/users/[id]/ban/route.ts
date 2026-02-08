import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { reason } = await request.json();

    await prisma.user.update({
      where: { id: params.id },
      data: {
        banned: true,
        banReason: reason || "No reason provided",
      },
    });

    // Also delete all active sessions for this user
    await prisma.session.deleteMany({
      where: { userId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to ban user:", error);
    return NextResponse.json(
      { error: "Failed to ban user" },
      { status: 500 }
    );
  }
}
