import { NextResponse } from "next/server"
import contentData from "@/data/content.json"

export function GET() {
  return NextResponse.json(contentData.items)
}
