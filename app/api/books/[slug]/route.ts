import { getBook } from "@/lib/seo/public-records"
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const record = await getBook(slug)
    return record ? NextResponse.json(record) : NextResponse.json({ error: "Book not found" }, { status: 404 })
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
