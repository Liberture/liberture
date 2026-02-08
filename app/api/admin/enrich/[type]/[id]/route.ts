import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Enrichment API Endpoint
 * 
 * Uses Perplexity API to research and enrich directory entries
 * with Wikipedia links, publications, speaking events, etc.
 */

interface EnrichmentResult {
  wikipedia?: string;
  publications?: string[];
  speakingEvents?: string[];
  achievements?: string[];
  summary: string;
}

async function enrichWithAI(name: string, type: string, context?: string): Promise<EnrichmentResult> {
  try {
    // Use Perplexity API if available
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    
    if (perplexityKey) {
      const prompt = `Research ${type === "people" ? "person" : type.slice(0, -1)} "${name}" in biohacking/health optimization context.
${context ? `Context: ${context}` : ''}

Find and return in JSON format:
- wikipedia: actual Wikipedia URL (verify it exists) or null
- publications: array of specific books/papers/research titles
- speakingEvents: array of specific podcasts/conferences with episode numbers
- achievements: array of specific awards/credentials/accomplishments

Return ONLY verified information. Use empty arrays if data not found. NO placeholders.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{
            role: 'user',
            content: prompt,
          }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            wikipedia: parsed.wikipedia || null,
            publications: Array.isArray(parsed.publications) ? parsed.publications : [],
            speakingEvents: Array.isArray(parsed.speakingEvents) ? parsed.speakingEvents : [],
            achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
            summary: `Found ${[
              parsed.wikipedia ? 'Wikipedia' : null,
              parsed.publications?.length ? 'publications' : null,
              parsed.speakingEvents?.length ? 'speaking events' : null,
              parsed.achievements?.length ? 'achievements' : null,
            ].filter(Boolean).join(', ')}`,
          };
        }
      }
    }
    
    // Fallback: Basic Wikipedia construction + web search hints
    const wikiSlug = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const wikiUrl = `https://en.wikipedia.org/wiki/${wikiSlug}`;
    
    // Try to verify Wikipedia link
    const wikiCheck = await fetch(wikiUrl, { method: 'HEAD' });
    const wikipedia = wikiCheck.ok ? wikiUrl : null;
    
    return {
      wikipedia,
      publications: [],
      speakingEvents: [],
      achievements: [],
      summary: wikipedia ? 'Added Wikipedia link' : 'No data found - manual review needed',
    };
  } catch (error) {
    console.error('Enrichment error:', error);
    return {
      wikipedia: null,
      publications: [],
      speakingEvents: [],
      achievements: [],
      summary: 'Enrichment failed',
    };
  }
}

export async function POST(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;
    
    // Validate type
    if (!["people", "books", "organizations", "protocols"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }
    
    // Fetch the entity
    let entity: any;
    let name: string;
    
    switch (type) {
      case "people":
        entity = await prisma.person.findUnique({ where: { id } });
        name = entity?.name || "";
        break;
      case "books":
        entity = await prisma.book.findUnique({ where: { id } });
        name = entity?.title || "";
        break;
      case "organizations":
        entity = await prisma.organization.findUnique({ where: { id } });
        name = entity?.name || "";
        break;
      case "protocols":
        entity = await prisma.protocol.findUnique({ where: { id } });
        name = entity?.name || "";
        break;
    }
    
    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }
    
    // Build context for enrichment
    const context = type === "people" 
      ? `Bio: ${entity.bio}. Expertise: ${entity.expertise}.`
      : type === "books"
      ? `Author: ${entity.author}. Description: ${entity.description}.`
      : `Description: ${entity.description}`;
    
    // Enrich with AI
    const enrichment = await enrichWithAI(name, type, context);
    
    // Determine which fields were added
    const fieldsAdded: string[] = [];
    if (enrichment.wikipedia) fieldsAdded.push("wikipedia");
    if (enrichment.publications?.length) fieldsAdded.push("publications");
    if (enrichment.speakingEvents?.length) fieldsAdded.push("speakingEvents");
    if (enrichment.achievements?.length) fieldsAdded.push("achievements");
    
    // Update database
    switch (type) {
      case "people":
        await prisma.person.update({
          where: { id },
          data: {
            wikipedia: enrichment.wikipedia || entity.wikipedia,
            publications: JSON.stringify(enrichment.publications || []),
            speakingEvents: JSON.stringify(enrichment.speakingEvents || []),
            achievements: JSON.stringify(enrichment.achievements || []),
          },
        });
        break;
      case "books":
        await prisma.book.update({
          where: { id },
          data: {
            wikipedia: enrichment.wikipedia || entity.wikipedia,
            publications: JSON.stringify(enrichment.publications || []),
          },
        });
        break;
      case "organizations":
        await prisma.organization.update({
          where: { id },
          data: {
            wikipedia: enrichment.wikipedia || entity.wikipedia,
            publications: JSON.stringify(enrichment.publications || []),
          },
        });
        break;
    }
    
    // Log enrichment
    await prisma.enrichmentLog.create({
      data: {
        entityType: type,
        entityId: id,
        entityName: name,
        fieldsAdded: JSON.stringify(fieldsAdded),
        source: "manual",
        enrichedBy: "admin", // TODO: Get actual user from session
      },
    });
    
    return NextResponse.json({
      success: true,
      summary: enrichment.summary,
      fieldsAdded,
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      { error: "Enrichment failed" },
      { status: 500 }
    );
  }
}
