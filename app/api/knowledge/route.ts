import { NextResponse } from "next/server"
import knowledgeData from "@/data/knowledge.json"

export function GET() {
  return NextResponse.json(knowledgeData)
}
