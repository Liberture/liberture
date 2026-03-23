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

    await prisma.user.update({
      where: { id },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to unban user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unban user" },
      { status: 500 }
    );
  }
}
