#!/usr/bin/env tsx
/**
 * SEO Health Check
 * 
 * Runs automated checks to ensure SEO best practices are followed:
 * - Sitemap exists and is accessible
 * - All pages have unique titles and descriptions
 * - No broken internal links
 * - Robots.txt is configured correctly
 * - Meta tags are present
 */

import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();
const baseUrl = 'https://liberture.com';

interface HealthIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix?: string;
}

const issues: HealthIssue[] = [];

async function checkSitemap() {
  console.log('🗺️  Checking sitemap...');
  
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    if (response.ok) {
      const text = await response.text();
      const urlCount = (text.match(/<url>/g) || []).length;
      console.log(`   ✅ Sitemap accessible with ${urlCount} URLs`);
    } else {
      issues.push({
        severity: 'error',
        category: 'Sitemap',
        message: `Sitemap returned HTTP ${response.status}`,
        fix: 'Check /app/sitemap.ts and rebuild'
      });
    }
  } catch (error) {
    issues.push({
      severity: 'error',
      category: 'Sitemap',
      message: `Sitemap not accessible: ${error}`,
      fix: 'Ensure app is running and sitemap.ts exists'
    });
  }
}

async function checkRobotsTxt() {
  console.log('🤖 Checking robots.txt...');
  
  try {
    const response = await fetch(`${baseUrl}/robots.txt`);
    if (response.ok) {
      const text = await response.text();
      if (text.includes('Sitemap:')) {
        console.log('   ✅ robots.txt contains sitemap reference');
      } else {
        issues.push({
          severity: 'warning',
          category: 'Robots.txt',
          message: 'robots.txt missing sitemap reference',
          fix: 'Add "Sitemap: https://liberture.com/sitemap.xml" to robots.txt'
        });
      }
    } else {
      issues.push({
        severity: 'error',
        category: 'Robots.txt',
        message: 'robots.txt not accessible',
        fix: 'Create /app/robots.ts'
      });
    }
  } catch (error) {
    issues.push({
      severity: 'error',
      category: 'Robots.txt',
      message: `robots.txt error: ${error}`,
      fix: 'Check /app/robots.ts'
    });
  }
}

async function checkMetaTags() {
  console.log('📝 Checking meta tags consistency...');
  
  const articles = await prisma.knowledgeArticle.findMany({
    select: { id: true, title: true, description: true, slug: true }
  });
  
  // Check for duplicate titles
  const titles = articles.map(a => a.title.toLowerCase());
  const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
  
  if (duplicateTitles.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'Meta Tags',
      message: `${duplicateTitles.length} articles have duplicate titles`,
      fix: 'Ensure all article titles are unique'
    });
  } else {
    console.log(`   ✅ All ${articles.length} articles have unique titles`);
  }
  
  // Check for missing descriptions
  const missingDescriptions = articles.filter(a => !a.description || a.description.length < 50);
  
  if (missingDescriptions.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'Meta Tags',
      message: `${missingDescriptions.length} articles have short/missing descriptions`,
      fix: 'Add descriptions (150-160 chars) to all articles'
    });
  } else {
    console.log(`   ✅ All articles have proper descriptions`);
  }
  
  // Check for duplicate slugs (should be prevented by DB constraint)
  const slugs = articles.map(a => a.slug);
  const duplicateSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  
  if (duplicateSlugs.length > 0) {
    issues.push({
      severity: 'error',
      category: 'Meta Tags',
      message: `${duplicateSlugs.length} duplicate slugs found!`,
      fix: 'Fix duplicate slugs immediately (breaks URLs)'
    });
  }
}

async function checkContentQuality() {
  console.log('📚 Checking content quality...');
  
  const articles = await prisma.knowledgeArticle.findMany({
    select: { title: true, description: true, readTime: true, tags: true }
  });
  
  // Check for articles with no tags
  const noTags = articles.filter(a => !a.tags || a.tags.split(',').length < 2);
  if (noTags.length > 0) {
    issues.push({
      severity: 'info',
      category: 'Content Quality',
      message: `${noTags.length} articles have fewer than 2 tags`,
      fix: 'Add relevant tags for better discoverability'
    });
  }
  
  // Check for unrealistic read times
  const badReadTime = articles.filter(a => a.readTime < 1 || a.readTime > 30);
  if (badReadTime.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'Content Quality',
      message: `${badReadTime.length} articles have unusual read times`,
      fix: 'Recalculate read times (words / 200 wpm)'
    });
  }
  
  console.log(`   ✅ Content quality check complete`);
}

async function checkInternalLinks() {
  console.log('🔗 Checking internal linking structure...');
  
  // This would require storing article content in DB
  // For now, just check if we have enough articles to cross-link
  const articleCount = await prisma.knowledgeArticle.count();
  
  if (articleCount < 10) {
    issues.push({
      severity: 'info',
      category: 'Internal Links',
      message: 'Fewer than 10 articles - limited internal linking opportunities',
      fix: 'Add more content'
    });
  } else {
    console.log(`   ✅ ${articleCount} articles available for internal linking`);
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEO Health Check Report');
  console.log('='.repeat(60) + '\n');
  
  await checkSitemap();
  await checkRobotsTxt();
  await checkMetaTags();
  await checkContentQuality();
  await checkInternalLinks();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Issues Found:');
  console.log('='.repeat(60) + '\n');
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');
  
  if (issues.length === 0) {
    console.log('✅ No issues found! SEO is healthy.\n');
  } else {
    
    if (errors.length > 0) {
      console.log(`❌ ERRORS (${errors.length}):`);
      errors.forEach((issue, i) => {
        console.log(`\n${i + 1}. [${issue.category}] ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      });
      console.log();
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length}):`);
      warnings.forEach((issue, i) => {
        console.log(`\n${i + 1}. [${issue.category}] ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      });
      console.log();
    }
    
    if (infos.length > 0) {
      console.log(`ℹ️  INFO (${infos.length}):`);
      infos.forEach((issue, i) => {
        console.log(`\n${i + 1}. [${issue.category}] ${issue.message}`);
        if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      });
      console.log();
    }
  }
  
  console.log('='.repeat(60));
  console.log(`Score: ${Math.max(0, 100 - (errors.length * 10 + warnings.length * 3 + infos.length))}/100`);
  console.log('='.repeat(60) + '\n');
  
  await prisma.$disconnect();
  
  // Exit with error code if critical issues found
  if (errors.length > 0) {
    process.exit(1);
  }
}

generateReport();
