import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser, isAdmin } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

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
    // Return empty gracefully — table may not exist yet in this env
    return NextResponse.json({ logs: [] });
  }
}
