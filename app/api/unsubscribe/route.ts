import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

// GET /api/unsubscribe?token=xxx&type=all|marketing|digest
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'all';

    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Decode the token (base64 encoded userId)
    let userId: string;
    try {
      userId = Buffer.from(token, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update preferences based on type
    const updates: Record<string, boolean> = {};
    
    if (type === 'all') {
      updates.emailNotifications = false;
      updates.marketingEmails = false;
      updates.weeklyDigest = false;
      updates.newContentAlerts = false;
    } else if (type === 'marketing') {
      updates.marketingEmails = false;
    } else if (type === 'digest') {
      updates.weeklyDigest = false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(new URL(`/unsubscribed?type=${type}`, request.url));
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
