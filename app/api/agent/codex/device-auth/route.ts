import { cancelDeviceAuth, deviceAuthStatus, startDeviceAuth } from "@/lib/habits/agent/sidecar"

import { adminSidecarCall } from "../respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * `codex login --device-auth`, run inside the coach container. It yields a link
 * and a one-time code; the admin signs in from any device and the container
 * picks up a login of its own. Nothing is ever copied in.
 */
export async function POST(request: Request) {
  return adminSidecarCall(request, startDeviceAuth)
}

export async function GET(request: Request) {
  return adminSidecarCall(request, deviceAuthStatus)
}

export async function DELETE(request: Request) {
  return adminSidecarCall(request, cancelDeviceAuth)
}
