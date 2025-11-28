import { NextResponse } from "next/server"
import contentData from "@/data/content.json"

export function GET(_: Request, { params }: { params: { id: string } }) {
  const content = contentData.items.find((item) => item.id === params.id)

  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 })
  }

  return NextResponse.json(content)
}
