import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const protocol = await prisma.protocol.findUnique({
      where: { slug },
      include: {
        relationsFrom: {
          include: { to: { select: { slug: true, name: true, pillar: true, description: true } } },
        },
        relationsTo: {
          include: { from: { select: { slug: true, name: true, pillar: true, description: true } } },
        },
      },
    });

    if (!protocol) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      );
    }

    const { relationsFrom, relationsTo, ...base } = protocol;
    const related = [
      ...relationsFrom.map((r) => ({ kind: r.kind, note: r.note, protocol: r.to })),
      ...relationsTo.map((r) => ({ kind: r.kind, note: r.note, protocol: r.from })),
    ];

    return NextResponse.json({ ...base, related });
  } catch (error) {
    console.error('Error fetching protocol:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
