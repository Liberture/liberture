import { logoutCodex } from "@/lib/habits/agent/sidecar"

import { adminSidecarCall } from "../respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return adminSidecarCall(request, logoutCodex)
}
