import { NextResponse } from "next/server"

import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { reminderStatus } from "@/lib/habits/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/v1/reminders/status (get_reminder_status, scope read)
 *
 * Whether reminders reach the user: notifications on/off, assistant-log
 * receipts on/off, subscribed devices, last delivered and last failed push,
 * quiet hours, and how many notifications went out since local midnight.
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user
  const status = await reminderStatus(user.userId)
  return NextResponse.json(
    {
      notifications: status.notifications,
      assistantReceipts: status.assistantReceipts,
      pushConfigured: status.pushConfigured,
      devices: status.devices,
      lastDeliveredAt: status.lastDeliveredAt,
      lastFailureAt: status.lastFailureAt,
      quietHours: status.quietHours,
      sentToday: status.sentToday,
      sentTodayByKind: status.sentTodayByKind,
      sentTodayByChannel: status.sentTodayByChannel,
      // A row is a claim to send, not proof the person saw it.
      note: "sentToday counts what was claimed today, not confirmed deliveries. By kind: habit = habit reminders, coach = coach check-ins and daytime pulses, log = receipts pushed when an assistant logged a habit or finished a todo (assistantReceipts says whether they're on). By channel: assistant = nudges an assistant recorded and sent itself; push = sent by this server (lastDeliveredAt shows the push service accepted one); local = shown by an open tab.",
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
