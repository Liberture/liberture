import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

// GET — Check collaboration status for the logged-in user
export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    if (!user.nostrPubkey) {
      return NextResponse.json({
        isCollaborator: false,
        hasPendingRequest: false,
        hasRejectedRequest: false,
      })
    }

    // Check if user is a collaborator
    const collaborator = await prisma.collaborator.findFirst({
      where: {
        OR: [
          { npub: user.nostrPubkey },
          { pubkeyHex: user.nostrPubkey },
        ],
      },
    })

    if (collaborator) {
      return NextResponse.json({
        isCollaborator: true,
        hasPendingRequest: false,
        hasRejectedRequest: false,
      })
    }

    // Check for existing request
    const request = await prisma.collaborationRequest.findFirst({
      where: {
        OR: [
          { npub: user.nostrPubkey },
          { pubkeyHex: user.nostrPubkey },
        ],
      },
    })

    if (request) {
      return NextResponse.json({
        isCollaborator: false,
        hasPendingRequest: request.status === "pending",
        hasRejectedRequest: request.status === "rejected",
        requestDate: request.createdAt.toISOString(),
      })
    }

    // No request yet
    return NextResponse.json({
      isCollaborator: false,
      hasPendingRequest: false,
      hasRejectedRequest: false,
    })
  } catch (error) {
    console.error("Failed to check collaboration status:", error)
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    )
  }
}
