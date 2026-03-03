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

// Hardcoded admin pubkey - the ONLY admin
// npub1m9vsm9d8sy0pevcjhenwm4ny6l37dm2hsg4dnusna43ql3n5305qy4zlg4
const ADMIN_PUBKEY_HEX = "d9590d95a7811e1cb312be66edd664d7e3e6ed57822ad9f213ed620fc6748be8"

/**
 * Check if a user is an admin.
 * Admin = ONLY the hardcoded admin pubkey. No exceptions.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nostrPubkey: true }
  })
  if (!user?.nostrPubkey) return false

  return user.nostrPubkey === ADMIN_PUBKEY_HEX
}
