import { codexAccount } from "@/lib/habits/agent/sidecar"

import { adminSidecarCall } from "./respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Which account the coach's codex is signed in as, and any login in progress. */
export async function GET(request: Request) {
  return adminSidecarCall(request, codexAccount)
}
