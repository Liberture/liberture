import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-better";
import { headers } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reason } = await request.json();

    // Use Better-Auth admin plugin to ban user
    await auth.api.banUser({
      body: {
        userId: params.id,
        banReason: reason || "No reason provided",
        // Optional: set ban expiration
        // banExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      headers: await headers(),
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
