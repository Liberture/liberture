import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existing = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (existing) {
      if (existing.subscribed) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 409 }
        )
      } else {
        // Re-subscribe
        await prisma.newsletter.update({
          where: { email },
          data: { subscribed: true }
        })
      }
    } else {
      // New subscriber
      await prisma.newsletter.create({
        data: { id: randomUUID(), email, subscribed: true, updatedAt: new Date() }
      })
    }

    // TODO: Send welcome email via Resend (optional for now)
    // await sendWelcomeEmail(email)

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed!'
    })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
