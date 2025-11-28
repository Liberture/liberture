import { NextResponse } from "next/server"
import marketplaceItems from "@/data/marketplace-items.json"

export function GET() {
  return NextResponse.json(marketplaceItems)
}
