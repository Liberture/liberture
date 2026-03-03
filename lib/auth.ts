import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Liberture admin pubkey (npub1m9vsm9d8sy0pevcjhenwm4ny6l37dm2hsg4dnusna43ql3n5305qy4zlg4)
const ADMIN_PUBKEY = 'd82c186db803c84f8596ed37ae77d47fd1b5abd04d5cd9e9de72a00f19a537d2'

export interface JWTPayload {
  userId: string
  email: string
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  
  if (!token) return null
  
  return verifyToken(token)
}

/**
 * Check if a user is an admin.
 * Admin = user whose nostrPubkey matches the Liberture admin pubkey
 *         OR user with a real email (not @nostr.liberture.com fake email)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, nostrPubkey: true }
  })
  
  if (!user) return false
  
  // Liberture admin by Nostr pubkey
  if (user.nostrPubkey === ADMIN_PUBKEY) return true
  
  // Legacy: email-based admins (email doesn't end in @nostr.liberture.com)
  if (user.email && !user.email.endsWith('@nostr.liberture.com')) return true
  
  return false
}
