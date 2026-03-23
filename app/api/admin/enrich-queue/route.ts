import { NextResponse } from "next/server";

// In-memory queue (persists across requests within the same server instance)
const enrichmentQueue: Array<{
  jobId: string;
  type: string;
  id: string;
  name: string;
  priority: string;
  status: string;
  createdAt: string;
  attempts: number;
  updatedAt?: string;
  result?: any;
}> = [];

export async function GET() {
  try {
    const pending = enrichmentQueue.filter((item) => item.status === "pending");

    return NextResponse.json({
      pending,
      total: enrichmentQueue.length,
    });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json({ pending: [], total: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, id, name, priority = "normal" } = await request.json();

    // Check if already queued
    const existing = enrichmentQueue.find(
      (item) => item.type === type && item.id === id
    );

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already queued",
        jobId: existing.jobId,
      });
    }

    // Add to queue
    const jobId = `enrich-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    enrichmentQueue.push({
      jobId,
      type,
      id,
      name,
      priority,
      status: "pending",
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Added to enrichment queue",
    });
  } catch (error) {
    console.error("Error adding to queue:", error);
    return NextResponse.json(
      { error: "Failed to add to queue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { jobId, status, result } = await request.json();

    const item = enrichmentQueue.find((i) => i.jobId === jobId);

    if (!item) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (result) item.result = result;
    if (status === "processing") item.attempts = (item.attempts || 0) + 1;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating queue:", error);
    return NextResponse.json(
      { error: "Failed to update queue" },
      { status: 500 }
    );
  }
}
