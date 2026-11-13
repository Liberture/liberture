import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requestEditContext, withDirectoryEdit } from "@/lib/directory/revisions"
import { getAuthUser, isAdmin } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const org = await withDirectoryEdit(prisma, requestEditContext(request, authUser.userId), tx => tx.organization.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        pillars: body.pillars,
        type: body.type,
        founded: body.founded === "" ? null : body.founded,
        website: body.website,
        resources: body.resources === "" ? null : body.resources,
        keyPeople: body.keyPeople === "" ? null : body.keyPeople,
        imageUrl: body.imageUrl === "" ? null : body.imageUrl,
        wikipedia: body.wikipedia === "" ? null : body.wikipedia,
        updatedAt: new Date(),
      },
    }))

    return NextResponse.json(org)
  } catch (error) {
    console.error("Error updating organization:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params

    await prisma.organization.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
  }
}
