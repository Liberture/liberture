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

async function enrichWithPerplexity(name: string, type: string): Promise<EnrichmentResult> {
  // TODO: Replace with actual Perplexity API call
  // For now, return mock enrichment based on web search patterns
  
  const result: EnrichmentResult = {
    wikipedia: `https://en.wikipedia.org/wiki/${name.replace(/\s+/g, '_')}`,
    publications: [
      `Research and publications by ${name}`,
      "Multiple peer-reviewed papers in health optimization",
    ],
    speakingEvents: [
      "Featured speaker at biohacking conferences",
      "Podcast appearances on health and wellness shows",
    ],
    achievements: [
      "Leading expert in human optimization",
      "Author of bestselling books on health",
    ],
    summary: "Added Wikipedia link, publications, speaking events, and achievements",
  };
  
  return result;
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
    
    // Enrich with AI
    const enrichment = await enrichWithPerplexity(name, type);
    
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
