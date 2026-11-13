import { NextResponse } from "next/server"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { directoryTypes } from "@/lib/directory/revisions"
import { prisma } from "@/lib/prisma"

const pageSize = 10

export async function GET(request: Request, { params }: { params: Promise<{ type: string, id: string }> }) {
  const user = await getAuthUser()
  if (!user || !await isAdmin(user.userId)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { type, id } = await params
  if (!directoryTypes.some(kind => kind === type)) {
    return NextResponse.json({ error: "Unknown entity type" }, { status: 404 })
  }
  const cursor = new URL(request.url).searchParams.get("cursor")
  if (cursor !== null && (!/^[1-9]\d{0,18}$/.test(cursor) || BigInt(cursor) > BigInt("9223372036854775807"))) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 })
  }

  const rows = await prisma.directoryRevision.findMany({
    where: { entityType: type === "projects" || type === "organizations" ? { in: ["organizations", "projects"] } : type, entityId: id, id: cursor ? { lt: BigInt(cursor) } : undefined },
    select: { id: true, source: true, actor: true, createdAt: true, changes: true },
    orderBy: { id: "desc" },
    take: pageSize + 1,
  })
  const entries = rows.slice(0, pageSize).map(row => ({ ...row, id: row.id.toString() }))
  return NextResponse.json({ entries, nextCursor: rows.length > pageSize ? entries[pageSize - 1].id : null }, {
    headers: { "Cache-Control": "private, no-store" },
  })
}
