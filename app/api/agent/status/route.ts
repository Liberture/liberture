import { NextResponse } from "next/server"

import { SidecarError, health, sidecarConfigured } from "@/lib/habits/agent/sidecar"
import { canManageCoach, getAuthFromRequest } from "@/lib/habits/app-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Whether the coach is configured and usable. Keep configured coaches visible
 * while disconnected so users can find connection settings. A dev checkout with no sidecar is a normal state,
 * not a fault.
 */
export async function GET(request: Request) {
  const auth = await getAuthFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
  }

  if (!sidecarConfigured()) {
    return NextResponse.json({ configured: false, available: false, reason: "not configured on this instance" })
  }

  const canManageConnection = await canManageCoach(auth)

  try {
    const status = await health()
    if (status.codexLoggedIn === false) {
      return NextResponse.json({
        configured: true, canManageConnection,
        available: false,
        reason: "the coach has not been connected to its AI provider yet",
        codexAuthOk: false,
      })
    }
    if (status.codexAuthOk === false) {
      // The fix is a command for whoever runs the host; the sidecar logs it
      // and /health carries it. Users only need to know it is not their fault.
      console.error("[agent/status] codex is logged out:", status.problem)
      return NextResponse.json({
        configured: true, canManageConnection,
        available: false,
        reason: "the coach is signed out of its AI provider — the site operator needs to log it in again",
        codexAuthOk: false,
      })
    }

    return NextResponse.json({
      configured: true, canManageConnection,
      available: true,
      // Surfaced so an operator can see a degraded deployment from the UI. The
      // sidecar refuses to start in this state unless deliberately overridden,
      // so in practice this is only false on a box someone opted out on.
      sandboxOk: status.sandboxOk,
      codexVersion: status.codexVersion,
    })
  } catch (error) {
    const reason = error instanceof SidecarError ? error.message : "the coach is unreachable"
    return NextResponse.json({ configured: true, canManageConnection, available: false, reason })
  }
}
