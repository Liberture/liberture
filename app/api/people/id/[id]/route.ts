import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requestEditContext, withDirectoryEdit } from "@/lib/directory/revisions"
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const person = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), async tx => {
      let summary = body.summary === "" ? null : body.summary
      if (body.bio !== undefined && summary === undefined) {
        const [existing] = await tx.$queryRaw<Array<{ bio: string }>>`SELECT bio FROM "Person" WHERE id = ${id} FOR UPDATE`
        if (existing && existing.bio !== body.bio) summary = null
      }
      return tx.person.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          name: body.name,
          title: body.title,
          bio: body.bio,
          summary,
          pillars: body.pillars,
          expertise: body.expertise,
          followers: body.followers === "" ? null : body.followers,
          website: body.website === "" ? null : body.website,
          wikipedia: body.wikipedia === "" ? null : body.wikipedia,
          twitter: body.twitter === "" ? null : body.twitter,
          instagram: body.instagram === "" ? null : body.instagram,
          youtube: body.youtube === "" ? null : body.youtube,
          podcast: body.podcast === "" ? null : body.podcast,
        },
      })
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
    const authUser = await getAuthUser();
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
