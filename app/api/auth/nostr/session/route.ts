import { managedAuthEnabled } from "@/lib/identity/config"
import { NextResponse } from "next/server"
import { nip19 } from "nostr-tools"
import { isLocalStorageMode } from "@/lib/habits/local-storage"
import { renewSession, deleteSession, getSessionTokenFromCookie, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/habits/nostr/session-store"
import { createNostrSessionsTable } from "@/lib/habits/db-migrate"

/**
 * GET /api/auth/nostr/session
 * Verify the httpOnly session cookie and return the associated pubkey
 * This allows clients to restore auth state without re-signing
 *
 * Cookie only: a token in the URL would land in logs and history, and setting
 * the cookie from one would let a link sign a visitor into someone else's account.
 */
export async function GET(request: Request) {
  try {
    if (managedAuthEnabled()) {
      const { trackerIdentity, signedInResponse } = await import("@/lib/identity/tracker")
      const current = await trackerIdentity(request.headers)
      const pubkey = current?.tracker.nostrPubkey
      if (!current || !pubkey) return NextResponse.json({ valid: false }, { status: 401 })
      const body = { valid: true, pubkey, npub: nip19.npubEncode(pubkey) }
      return current.imported ? signedInResponse(request, current.tracker.id, body, current.imported) : NextResponse.json(body)
    }
    const token = getSessionTokenFromCookie(request)

    if (!token) {
      return NextResponse.json({ error: "Missing session token" }, { status: 401 })
    }

    if (isLocalStorageMode()) {
      return NextResponse.json({ 
        error: "Session auth requires database mode" 
      }, { status: 400 })
    }

    // Ensure sessions table exists
    await createNostrSessionsTable()

    const pubkey = await renewSession(token)

    if (!pubkey) {
      return NextResponse.json({ 
        valid: false,
        error: "Invalid or expired session" 
      }, { status: 401 })
    }

    // Convert to npub for display
    let npub = ""
    try {
      npub = nip19.npubEncode(pubkey)
    } catch {
      npub = pubkey
    }

    const response = NextResponse.json({
      valid: true,
      pubkey,
      npub,
    })
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    })
    return response
  } catch (error) {
    console.error("Failed to verify session:", error)
    return NextResponse.json({ error: "Session verification failed" }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/nostr/session
 * Logout: invalidate the session in the httpOnly cookie and clear it
 */
export async function DELETE(request: Request) {
  try {
    if (managedAuthEnabled()) {
      const { managedSignOut } = await import("@/lib/identity/tracker")
      return managedSignOut(request)
    }
    const token = getSessionTokenFromCookie(request)

    if (!token) {
      const response = NextResponse.json({ success: true })
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      })
      return response
    }

    if (isLocalStorageMode()) {
      const response = NextResponse.json({ success: true })
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      })
      return response
    }

    await createNostrSessionsTable()
    await deleteSession(token)

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error("Failed to delete session:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}
