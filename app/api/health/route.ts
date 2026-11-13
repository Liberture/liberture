import { NextResponse } from "next/server"
import { version } from "@/package.json"

/**
 * GET /api/health
 * Returns health check status for monitoring.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version,
  })
}
