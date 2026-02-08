import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Save to database
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
        replied: false
      }
    })

    // TODO: Send email notification via Resend (optional for now)
    // await sendContactNotification({ name, email, subject, message })

    return NextResponse.json({
      success: true,
      message: 'Message received! We\'ll respond soon.'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
