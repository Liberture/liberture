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
  wikipedia?: string | null;
  publications?: string[];
  speakingEvents?: string[];
  achievements?: string[];
  summary: string;
}

async function verifyWikipediaUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.ok;
  } catch {
    return false;
  }
}

async function enrichWithPerplexity(name: string, type: string, context?: string): Promise<EnrichmentResult> {
  try {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityKey) {
      console.error('PERPLEXITY_API_KEY not found');
      return {
        wikipedia: null,
        publications: [],
        speakingEvents: [],
        achievements: [],
        summary: 'API key missing',
      };
    }

    // Build a detailed prompt based on entity type
    let prompt = '';
    
    if (type === "people") {
      prompt = `Research the person "${name}" in the context of biohacking, health optimization, longevity, or related fields.
${context ? `\nKnown context: ${context}` : ''}

Find and return ONLY verified, specific information in this exact JSON format:
{
  "wikipedia": "exact Wikipedia URL if exists, otherwise null",
  "publications": ["Book Title (Year)", "Paper Title in Journal Name (Year)", etc.],
  "speakingEvents": ["TED Talk: Title (Month Year)", "Podcast Name Episode #number (Month Year)", etc.],
  "achievements": ["Specific credential/position at Institution", "Award Name (Year)", etc.]
}

Requirements:
- Wikipedia URL must be exact and verifiable (e.g., https://en.wikipedia.org/wiki/Andrew_Huberman)
- Publications: Include books, research papers, articles with full titles and years
- Speaking Events: Include TED talks, major podcasts with episode numbers, conferences with dates
- Achievements: Include current/past positions, degrees, awards, notable accomplishments

Return ONLY the JSON object. No markdown, no explanations.`;
    } else if (type === "books") {
      prompt = `Research the book "${name}" ${context ? `by ${context}` : ''}.

Find and return in this exact JSON format:
{
  "wikipedia": "exact Wikipedia URL for the book if exists, otherwise null",
  "publications": ["Review/feature in Publication Name (Year)", "Interview about book in Media (Year)"]
}

Return ONLY the JSON object.`;
    } else if (type === "organizations") {
      prompt = `Research the organization "${name}" in health/biohacking context.
${context ? `\nContext: ${context}` : ''}

Find and return in this exact JSON format:
{
  "wikipedia": "exact Wikipedia URL if exists, otherwise null",
  "publications": ["Research paper/report title (Year)", "Key publication"]
}

Return ONLY the JSON object.`;
    }

    console.log(`🔍 Enriching ${type}: ${name}`);
    
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
        temperature: 0.1, // Low temperature for factual responses
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('📥 Perplexity response:', content.substring(0, 500));
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonString = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    // Find JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return {
        wikipedia: null,
        publications: [],
        speakingEvents: [],
        achievements: [],
        summary: 'Failed to parse AI response',
      };
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Verify Wikipedia URL if provided
    let verifiedWikipedia = null;
    if (parsed.wikipedia && typeof parsed.wikipedia === 'string') {
      const isValid = await verifyWikipediaUrl(parsed.wikipedia);
      if (isValid) {
        verifiedWikipedia = parsed.wikipedia;
        console.log('✅ Wikipedia URL verified:', verifiedWikipedia);
      } else {
        console.log('❌ Wikipedia URL invalid:', parsed.wikipedia);
      }
    }
    
    const result: EnrichmentResult = {
      wikipedia: verifiedWikipedia,
      publications: Array.isArray(parsed.publications) ? parsed.publications.filter(Boolean) : [],
      speakingEvents: Array.isArray(parsed.speakingEvents) ? parsed.speakingEvents.filter(Boolean) : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.filter(Boolean) : [],
      summary: '',
    };
    
    // Build summary
    const found = [];
    if (result.wikipedia) found.push('Wikipedia');
    if (result.publications.length) found.push(`${result.publications.length} publications`);
    if (result.speakingEvents?.length) found.push(`${result.speakingEvents.length} speaking events`);
    if (result.achievements?.length) found.push(`${result.achievements.length} achievements`);
    
    result.summary = found.length ? `✅ Found: ${found.join(', ')}` : '⚠️ No data found';
    
    return result;
  } catch (error) {
    console.error('Enrichment error:', error);
    return {
      wikipedia: null,
      publications: [],
      speakingEvents: [],
      achievements: [],
      summary: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    
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
    let context = '';
    
    switch (type) {
      case "people":
        entity = await prisma.person.findUnique({ where: { id } });
        name = entity?.name || "";
        context = entity ? `${entity.title}. ${entity.bio}` : '';
        break;
      case "books":
        entity = await prisma.book.findUnique({ where: { id } });
        name = entity?.title || "";
        context = entity?.author || '';
        break;
      case "organizations":
        entity = await prisma.organization.findUnique({ where: { id } });
        name = entity?.name || "";
        context = entity?.description || '';
        break;
      case "protocols":
        entity = await prisma.protocol.findUnique({ where: { id } });
        name = entity?.name || "";
        context = entity?.description || '';
        break;
    }
    
    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found" },
        { status: 404 }
      );
    }
    
    // Enrich with Perplexity AI
    const enrichment = await enrichWithPerplexity(name, type, context);
    
    // Determine which fields were added/updated
    const fieldsAdded: string[] = [];
    const updateData: any = {};
    
    if (enrichment.wikipedia) {
      fieldsAdded.push("wikipedia");
      updateData.wikipedia = enrichment.wikipedia;
    }
    
    if (enrichment.publications && enrichment.publications.length > 0) {
      fieldsAdded.push("publications");
      updateData.publications = JSON.stringify(enrichment.publications);
    }
    
    if (enrichment.speakingEvents && enrichment.speakingEvents.length > 0) {
      fieldsAdded.push("speakingEvents");
      updateData.speakingEvents = JSON.stringify(enrichment.speakingEvents);
    }
    
    if (enrichment.achievements && enrichment.achievements.length > 0) {
      fieldsAdded.push("achievements");
      updateData.achievements = JSON.stringify(enrichment.achievements);
    }
    
    // Update database only if we have data
    if (Object.keys(updateData).length > 0) {
      switch (type) {
        case "people":
          await prisma.person.update({
            where: { id },
            data: updateData,
          });
          break;
        case "books":
          await prisma.book.update({
            where: { id },
            data: {
              wikipedia: updateData.wikipedia || entity.wikipedia,
              publications: updateData.publications || entity.publications,
            },
          });
          break;
        case "organizations":
          await prisma.organization.update({
            where: { id },
            data: {
              wikipedia: updateData.wikipedia || entity.wikipedia,
              publications: updateData.publications || entity.publications,
            },
          });
          break;
      }
      
      // Log enrichment
      await prisma.enrichmentLog.create({
        data: {
          entityType: type.slice(0, -1), // Remove plural 's'
          entityId: id,
          entityName: name,
          fieldsAdded: JSON.stringify(fieldsAdded),
          source: "ai",
          enrichedBy: "perplexity",
        },
      });
    }
    
    return NextResponse.json({
      success: fieldsAdded.length > 0,
      summary: enrichment.summary,
      fieldsAdded,
      data: {
        wikipedia: enrichment.wikipedia,
        publicationsCount: enrichment.publications?.length || 0,
        speakingEventsCount: enrichment.speakingEvents?.length || 0,
        achievementsCount: enrichment.achievements?.length || 0,
      },
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enrichment failed" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
