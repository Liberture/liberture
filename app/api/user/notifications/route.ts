import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/user/notifications - Get current user's notification preferences
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotifications: true,
        marketingEmails: true,
        weeklyDigest: true,
        newContentAlerts: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/notifications - Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Get userId from session/auth
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emailNotifications, marketingEmails, weeklyDigest, newContentAlerts } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof emailNotifications === 'boolean' && { emailNotifications }),
        ...(typeof marketingEmails === 'boolean' && { marketingEmails }),
        ...(typeof weeklyDigest === 'boolean' && { weeklyDigest }),
        ...(typeof newContentAlerts === 'boolean' && { newContentAlerts }),
      },
      select: {
        emailNotifications: true,
        marketingEmails: true,
        weeklyDigest: true,
        newContentAlerts: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
