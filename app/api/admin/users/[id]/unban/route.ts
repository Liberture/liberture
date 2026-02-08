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

    // Use Better-Auth admin plugin to unban user
    await auth.api.unbanUser({
      body: {
        userId: params.id,
      },
      headers: await headers(),
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
