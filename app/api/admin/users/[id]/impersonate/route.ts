import { NextResponse } from "next/server";
import { getAuthUser, isAdmin, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a JWT for the impersonated user
    const jwt = signToken({ userId: user.id, email: user.email });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to impersonate user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to impersonate user" },
      { status: 500 }
    );
  }
}
