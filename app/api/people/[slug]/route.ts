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

    // Fetch protocols where this person is the creator
    const protocols = await prisma.protocol.findMany({
      where: {
        creator: slug,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        pillar: true,
        difficulty: true,
        duration: true,
        featured: true,
      },
      orderBy: {
        featured: 'desc',
      },
    });

    // Add protocols to person object
    const personWithProtocols = {
      ...person,
      Protocol: protocols,
    };

    return NextResponse.json(personWithProtocols);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
