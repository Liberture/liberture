import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { validateAuthEvent } from '@/lib/nostr'
import type { NostrEvent } from '@/types/nostr'

// GET — Issue a random challenge for the client to sign
export async function GET() {
  const challenge = crypto.randomBytes(32).toString('hex')

  const response = NextResponse.json({ challenge })
  response.cookies.set('nostr_challenge', challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300, // 5 minutes
  })

  return response
}

// POST — Verify the signed event and issue a JWT
export async function POST(request: Request) {
  try {
    const { signedEvent } = (await request.json()) as { signedEvent: NostrEvent }

    const cookieStore = await cookies()
    const challenge = cookieStore.get('nostr_challenge')?.value

    if (!challenge) {
      return NextResponse.json(
        { error: 'No challenge found. Please try again.' },
        { status: 400 }
      )
    }

    if (!validateAuthEvent(signedEvent, challenge)) {
      return NextResponse.json(
        { error: 'Invalid signature or expired challenge' },
        { status: 401 }
      )
    }

    const pubkey = signedEvent.pubkey

    // Find or create user by Nostr pubkey
    let user = await prisma.user.findFirst({
      where: { nostrPubkey: pubkey },
    })

    if (!user) {
      const shortPubkey = pubkey.slice(0, 12)
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          nostrPubkey: pubkey,
          email: `${shortPubkey}@nostr.liberture.com`,
          name: `Nostr User ${shortPubkey}`,
          bosLevel: 1,
          updatedAt: new Date(),
        },
      })
    }

    // Issue JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bosLevel: user.bosLevel,
        nostrPubkey: user.nostrPubkey,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Clear the challenge cookie
    response.cookies.set('nostr_challenge', '', { maxAge: 0 })

    return response
  } catch (error) {
    console.error('Nostr auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
