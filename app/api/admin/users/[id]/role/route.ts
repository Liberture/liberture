import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-better";
import { headers } from "next/headers";

export async function PUT(
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

    const { role } = await request.json();

    if (!["user", "admin", "moderator"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Use Better-Auth admin plugin to set user role
    await auth.api.setRole({
      body: {
        userId: params.id,
        role,
      },
      headers: await headers(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}
