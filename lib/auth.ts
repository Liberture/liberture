import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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
 * Admin = user whose nostrPubkey matches a configured liberture NostrAccount
 *         OR user with a real email (not @nostr.liberture.com fake email)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, nostrPubkey: true }
  })
  
  if (!user) return false
  
  // Legacy: email-based admins (email doesn't end in @nostr.liberture.com)
  if (user.email && !user.email.endsWith('@nostr.liberture.com')) return true
  
  // Nostr: check if user's pubkey matches any configured liberture NostrAccount
  if (user.nostrPubkey) {
    const libertureAccount = await prisma.nostrAccount.findFirst({
      where: { role: 'liberture', pubkeyHex: user.nostrPubkey }
    })
    if (libertureAccount) return true
  }
  
  return false
}
