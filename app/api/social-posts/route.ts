import { NextResponse } from "next/server"
import socialPosts from "@/data/social-posts.json"

export function GET() {
  return NextResponse.json(socialPosts)
}
