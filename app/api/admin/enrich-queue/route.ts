import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Enrichment Queue System
 * 
 * GET: List pending enrichments
 * POST: Add new enrichment to queue
 * PATCH: Update enrichment status
 */

export async function GET() {
  try {
    // Check if enrichment queue table exists, if not use in-memory
    // For now, return pending enrichments from a JSON file
    const fs = require('fs');
    const path = require('path');
    const queuePath = path.join(process.cwd(), 'data', 'enrichment-queue.json');
    
    // Create directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create queue file if it doesn't exist
    if (!fs.existsSync(queuePath)) {
      fs.writeFileSync(queuePath, JSON.stringify({ queue: [] }));
    }
    
    const data = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
    const pending = data.queue.filter((item: any) => item.status === 'pending');
    
    return NextResponse.json({ 
      pending,
      total: data.queue.length 
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json({ pending: [], total: 0 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, id, name, priority = 'normal' } = await request.json();
    
    const fs = require('fs');
    const path = require('path');
    const queuePath = path.join(process.cwd(), 'data', 'enrichment-queue.json');
    
    // Create directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Load current queue
    let data = { queue: [] };
    if (fs.existsSync(queuePath)) {
      data = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
    }
    
    // Check if already queued
    const existing = data.queue.find((item: any) => 
      item.type === type && item.id === id
    );
    
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already queued',
        jobId: existing.jobId 
      });
    }
    
    // Add to queue
    const jobId = `enrich-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    data.queue.push({
      jobId,
      type,
      id,
      name,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    
    // Save queue
    fs.writeFileSync(queuePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      jobId,
      message: 'Added to enrichment queue' 
    });
  } catch (error) {
    console.error('Error adding to queue:', error);
    return NextResponse.json(
      { error: 'Failed to add to queue' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { jobId, status, result } = await request.json();
    
    const fs = require('fs');
    const path = require('path');
    const queuePath = path.join(process.cwd(), 'data', 'enrichment-queue.json');
    
    if (!fs.existsSync(queuePath)) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }
    
    const data = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
    const item = data.queue.find((i: any) => i.jobId === jobId);
    
    if (!item) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Update item
    item.status = status;
    item.updatedAt = new Date().toISOString();
    if (result) item.result = result;
    if (status === 'processing') item.attempts = (item.attempts || 0) + 1;
    
    // Save queue
    fs.writeFileSync(queuePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating queue:', error);
    return NextResponse.json(
      { error: 'Failed to update queue' },
      { status: 500 }
    );
  }
}
