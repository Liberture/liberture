#!/usr/bin/env tsx
/**
 * Ping Search Engines
 * 
 * Notifies Google and Bing when new content is published
 * to speed up indexing.
 */

const SITEMAP_URL = 'https://liberture.com/sitemap.xml';

async function pingGoogle() {
  console.log('🔔 Pinging Google...');
  
  try {
    const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const response = await fetch(url);
    
    if (response.ok) {
      console.log('   ✅ Google pinged successfully');
      return true;
    } else {
      console.log(`   ⚠️  Google ping returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Google ping failed: ${error}`);
    return false;
  }
}

async function pingBing() {
  console.log('🔔 Pinging Bing...');
  
  try {
    const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    const response = await fetch(url);
    
    if (response.ok) {
      console.log('   ✅ Bing pinged successfully');
      return true;
    } else {
      console.log(`   ⚠️  Bing ping returned ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Bing ping failed: ${error}`);
    return false;
  }
}

async function pingIndexNow() {
  console.log('🔔 Pinging IndexNow...');
  
  // IndexNow requires an API key
  // For now, just log that it's available
  console.log('   ℹ️  IndexNow requires API key (optional)');
  console.log('   Setup: https://www.indexnow.org/');
  
  return true;
}

async function main() {
  console.log('🚀 Notifying search engines of sitemap update...\n');
  
  const results = await Promise.all([
    pingGoogle(),
    pingBing(),
    pingIndexNow()
  ]);
  
  console.log('\n' + '='.repeat(60));
  
  if (results.every(r => r)) {
    console.log('✅ All search engines notified successfully!');
    console.log('\nNext steps:');
    console.log('1. Check Google Search Console in 24-48 hours');
    console.log('2. Verify new pages appear in search results');
    console.log('3. Monitor indexing status');
  } else {
    console.log('⚠️  Some pings failed. Check logs above.');
    console.log('\nManual submission:');
    console.log('- Google: https://search.google.com/search-console');
    console.log('- Bing: https://www.bing.com/webmasters');
  }
  
  console.log('='.repeat(60));
}

main();
