import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user to impersonate
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.banned) {
      return NextResponse.json(
        { error: "Cannot impersonate banned user" },
        { status: 403 }
      );
    }

    // Create an impersonation session (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set("better-auth.session_token", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to impersonate user:", error);
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}
