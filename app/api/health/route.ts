import { NextResponse } from "next/server"

/**
 * GET /api/health
 * Returns health check status for monitoring.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
}
