import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Update person
    const person = await prisma.person.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        bio: body.bio,
        pillars: body.pillars,
        expertise: body.expertise,
        followers: body.followers || null,
        website: body.website || null,
        wikipedia: body.wikipedia || null,
        twitter: body.twitter || null,
        instagram: body.instagram || null,
        youtube: body.youtube || null,
        podcast: body.podcast || null,
      },
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      { error: 'Failed to update person' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.person.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json(
      { error: 'Failed to delete person' },
      { status: 500 }
    );
  }
}
