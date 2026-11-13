import { NextResponse } from "next/server"

import { verifiedTrackerUserId } from "@/lib/habits/app-auth"

/** Owner-only settings routes receive the account ID verified from the request. */
export function withTrackerOwner<Context extends unknown[]>(
  handler: (userId: number, request: Request, ...context: Context) => Promise<Response>,
  unauthorizedMessage = "Unauthorized"
) {
  return async (request: Request, ...context: Context): Promise<Response> => {
    const userId = await verifiedTrackerUserId(request)
    if (userId === null) {
      return NextResponse.json({ error: unauthorizedMessage }, { status: 401, headers: { "Cache-Control": "private, no-store" } })
    }
    const response = await handler(userId, request, ...context)
    response.headers.set("Cache-Control", "private, no-store")
    return response
  }
}
