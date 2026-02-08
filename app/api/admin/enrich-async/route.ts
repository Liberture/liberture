import { NextResponse } from "next/server";

/**
 * Async Enrichment Trigger
 * 
 * Sends enrichment requests to OpenClaw agent to process asynchronously
 */

export async function POST(request: Request) {
  try {
    const { type, id, name } = await request.json();
    
    // Send message to OpenClaw to enrich this entry
    const message = `ENRICHMENT REQUEST:
Type: ${type}
ID: ${id}
Name: ${name}

Please research this ${type.slice(0, -1)} and enrich the Liberture database entry at https://liberture.com/admin-login

Research and find:
1. Wikipedia link (verify it's valid)
2. Publications (books, papers, research)
3. Speaking events (podcasts with episode numbers, conferences)
4. Achievements (awards, credentials)

After research, update the database using:
cd /root/liberture && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.${type}.update({
  where: { id: '${id}' },
  data: {
    wikipedia: 'URL',
    publications: JSON.stringify([...]),
    ${type === 'people' ? "speakingEvents: JSON.stringify([...])," : ""}
    ${type === 'people' ? "achievements: JSON.stringify([...])," : ""}
  }
}).then(() => console.log('✅ Enriched ${name}')).finally(() => prisma.\\$disconnect())
"

Also log to enrichment history.`;

    // This would send to OpenClaw's message queue
    // For now, return job ID
    const jobId = `enrich-${type}-${id}-${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Enrichment request queued',
    });
  } catch (error) {
    console.error('Failed to queue enrichment:', error);
    return NextResponse.json(
      { error: 'Failed to queue enrichment' },
      { status: 500 }
    );
  }
}
