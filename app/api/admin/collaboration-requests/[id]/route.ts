import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// PATCH — Update request status (approve or reject)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action - must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find the request
    const collabRequest = await prisma.collaborationRequest.findUnique({
      where: { id },
    });

    if (!collabRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (collabRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Request has already been reviewed" },
        { status: 400 }
      );
    }

    // Update the request status
    const updatedRequest = await prisma.collaborationRequest.update({
      where: { id },
      data: {
        status: action === "approve" ? "approved" : "rejected",
        reviewedAt: new Date(),
        reviewedBy: user.userId,
      },
    });

    // If approved, create a Collaborator record
    if (action === "approve") {
      // Check if collaborator already exists (shouldn't happen but be safe)
      const existingCollab = await prisma.collaborator.findUnique({
        where: { npub: collabRequest.npub },
      });

      if (!existingCollab) {
        await prisma.collaborator.create({
          data: {
            npub: collabRequest.npub,
            pubkeyHex: collabRequest.pubkeyHex,
            isActive: true,
            approvedAt: new Date(),
            approvedBy: user.userId,
          },
        });
      }
    }

    return NextResponse.json({
      request: updatedRequest,
      message: action === "approve" 
        ? "Request approved - collaborator added to whitelist" 
        : "Request rejected",
    });
  } catch (error) {
    console.error("Failed to update collaboration request:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
