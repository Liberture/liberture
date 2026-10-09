import { NextResponse } from "next/server"

import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { reminderStatus } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/v1/reminders/status (get_reminder_status, scope read)
 *
 * Whether reminders reach the user: notifications on/off, subscribed
 * devices, last delivered and last failed push, quiet hours, and how many
 * notifications went out since local midnight.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user
  const status = await reminderStatus(user.userId)
  return NextResponse.json(
    {
      notifications: status.notifications,
      pushConfigured: status.pushConfigured,
      devices: status.devices,
      lastDeliveredAt: status.lastDeliveredAt,
      lastFailureAt: status.lastFailureAt,
      quietHours: status.quietHours,
      sentToday: status.sentToday,
      sentTodayByKind: status.sentTodayByKind,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
