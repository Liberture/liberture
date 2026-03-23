import { NextResponse } from "next/server";
import { getAuthUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser();

    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason } = await request.json();

    await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason || "No reason provided",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to ban user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ban user" },
      { status: 500 }
    );
  }
}
