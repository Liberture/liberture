import { NextResponse } from "next/server"
import { effectivePermissions } from "@/lib/habits/api-scopes"
import { verifyApiKey } from "@/lib/habits/integration-auth"

/** Who is signed in on this browser, for the consent page. Owner auth only. */
export async function GET(request: Request) {
  const user = await verifyApiKey(request)
  if (!user) return NextResponse.json({ signedIn: false }, { status: 401 })
  return NextResponse.json(
    {
      signedIn: true,
      name: user.data.profile?.name ?? null,
      permissions: effectivePermissions((user.data as unknown as Record<string, unknown>).integrationPermissions),
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
