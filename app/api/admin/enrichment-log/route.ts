import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const entityType = searchParams.get("entityType");
    
    const where = entityType ? { entityType } : {};
    
    const logs = await prisma.enrichmentLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching enrichment logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
