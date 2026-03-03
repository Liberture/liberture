import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET — List requests with optional ?status=pending|approved|rejected
export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 }
      );
    }

    // Get requests with filter
    const requests = await prisma.collaborationRequest.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });

    // Get counts for all statuses
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.collaborationRequest.count({ where: { status: "pending" } }),
      prisma.collaborationRequest.count({ where: { status: "approved" } }),
      prisma.collaborationRequest.count({ where: { status: "rejected" } }),
    ]);

    return NextResponse.json({
      requests,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("Failed to load collaboration requests:", error);
    return NextResponse.json(
      { error: "Failed to load requests" },
      { status: 500 }
    );
  }
}
