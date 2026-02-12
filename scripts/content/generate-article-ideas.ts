#!/usr/bin/env tsx
/**
 * AI-Powered Article Idea Generator
 * 
 * Uses Perplexity to generate content ideas based on:
 * - Current trending biohacking topics
 * - Keyword gaps in existing content
 * - User search intent
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment
const envPath = join(__dirname, '../../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    let cleanValue = value.trim();
    if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
        (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
      cleanValue = cleanValue.slice(1, -1);
    }
    process.env[key.trim()] = cleanValue;
  }
});

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
  console.error('❌ PERPLEXITY_API_KEY not found');
  process.exit(1);
}

async function generateIdeas(pillar: string) {
  console.log(`💡 Generating article ideas for: ${pillar}\n`);
  
  const prompt = `You are a biohacking content strategist. Generate 10 article ideas for the "${pillar}" pillar of a biohacking knowledge base.

Requirements:
- Each idea should target a specific keyword with search volume
- Topics should be actionable and educational
- Mix of beginner, intermediate, and advanced content
- Include both trending topics and evergreen content
- Focus on science-backed, practical information

For each idea, provide:
1. Article title (SEO-optimized, 60 chars max)
2. Target keyword
3. Brief description (150 chars)
4. Difficulty level (beginner/intermediate/advanced)
5. Why it's valuable

Format as JSON array:
[
  {
    "title": "...",
    "keyword": "...",
    "description": "...",
    "difficulty": "...",
    "value": "..."
  }
]`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a biohacking content strategist with deep knowledge of SEO and user search intent.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from markdown code block if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('❌ Could not parse JSON response');
      console.log('Raw response:', content);
      return [];
    }
    
    const ideas = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    
    console.log(`✅ Generated ${ideas.length} ideas for ${pillar}:\n`);
    
    ideas.forEach((idea: any, i: number) => {
      console.log(`${i + 1}. ${idea.title}`);
      console.log(`   Keyword: ${idea.keyword}`);
      console.log(`   Level: ${idea.difficulty}`);
      console.log(`   ${idea.description}`);
      console.log(`   💡 ${idea.value}`);
      console.log();
    });
    
    return ideas;
    
  } catch (error) {
    console.error('❌ Error generating ideas:', error);
    return [];
  }
}

async function main() {
  const pillars = ['Cognition', 'Recovery', 'Fueling', 'Mental', 'Physicality', 'Finance'];
  const pillar = process.argv[2] || pillars[Math.floor(Math.random() * pillars.length)];
  
  await generateIdeas(pillar);
  
  console.log('💡 To generate ideas for a specific pillar:');
  console.log('   npx tsx scripts/content/generate-article-ideas.ts Cognition');
}

main();
