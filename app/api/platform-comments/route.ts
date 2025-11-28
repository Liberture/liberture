import { NextResponse } from "next/server"
import platformComments from "@/data/platform-comments.json"

export function GET() {
  return NextResponse.json(platformComments)
}
