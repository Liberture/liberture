import { NextResponse } from "next/server"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { 
  getPublisher, 
  createPersonEvent,
  createOrganizationEvent,
  createProtocolEvent,
  createBookEvent,
  createLongFormEvent,
} from "@/lib/nostr-publisher"

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await isAdmin(authUser.userId)
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 })
    }

    // Create the appropriate event
    let event
    switch (type) {
      case "person":
        event = createPersonEvent(data)
        break
      case "organization":
        event = createOrganizationEvent(data)
        break
      case "protocol":
        event = createProtocolEvent(data)
        break
      case "book":
        event = createBookEvent(data)
        break
      case "article":
        event = createLongFormEvent(data)
        break
      default:
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    // Publish the event
    const publisher = getPublisher()
    const result = await publisher.publish(event)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to publish", result },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      relaysPublished: result.relaysPublished,
      relaysFailed: result.relaysFailed,
    })
  } catch (error: any) {
    console.error("[Publish API] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish" },
      { status: 500 }
    )
  }
}
