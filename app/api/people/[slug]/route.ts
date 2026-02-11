import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const person = await prisma.person.findUnique({
      where: { slug },
      include: {
        Book: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            year: true,
            pages: true,
            rating: true,
            amazonUrl: true,
            imageUrl: true,
            pillars: true,
          },
          orderBy: [
            { featured: 'desc' },
            { year: 'desc' },
          ],
        },
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
