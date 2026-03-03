import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  const { pubkey } = await params

  if (!pubkey || !/^[0-9a-f]{64}$/i.test(pubkey)) {
    return NextResponse.json({ error: 'Invalid pubkey' }, { status: 400 })
  }

  // Try multiple sources in order, return first success
  const sources = [
    () => fetchFromNostrBand(pubkey),
    () => fetchFromPurplepages(pubkey),
    () => fetchFromPrimalCache(pubkey),
  ]

  for (const source of sources) {
    try {
      const profile = await source()
      if (profile && (profile.name || profile.picture)) {
        return NextResponse.json({ profile })
      }
    } catch (e) {
      console.error('Profile fetch error:', e)
      // try next source
    }
  }

  return NextResponse.json({ profile: null })
}

async function fetchFromNostrBand(pubkey: string) {
  // nostr.band has a reliable profile API
  const res = await fetch(`https://api.nostr.band/v0/profiles/${pubkey}`, {
    signal: AbortSignal.timeout(5000),
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  const data = await res.json()
  
  // nostr.band returns profile in a specific format
  const profile = data?.profiles?.[pubkey] || data?.profile
  if (!profile) return null

  return {
    name: profile.name || profile.display_name || profile.displayName,
    about: profile.about,
    picture: profile.picture || profile.image,
    nip05: profile.nip05,
    banner: profile.banner,
    website: profile.website,
    lud16: profile.lud16,
  }
}

async function fetchFromPurplepages(pubkey: string) {
  // purplepag.es is a dedicated kind 0 caching service
  const res = await fetch(`https://purplepag.es/api/${pubkey}/info`, {
    signal: AbortSignal.timeout(4000),
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  const data = await res.json()
  
  return {
    name: data.name || data.display_name,
    about: data.about,
    picture: data.picture,
    nip05: data.nip05,
    banner: data.banner,
    website: data.website,
  }
}

async function fetchFromPrimalCache(pubkey: string) {
  // Primal's caching service
  const res = await fetch(`https://cache.primal.net/users/${pubkey}`, {
    signal: AbortSignal.timeout(4000),
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  const data = await res.json()
  
  // Check different possible response formats
  const metadata = data?.metadata || data?.content || data
  if (!metadata) return null

  // If content is a string, parse it
  const profile = typeof metadata === 'string' ? JSON.parse(metadata) : metadata

  return {
    name: profile.name || profile.display_name,
    about: profile.about,
    picture: profile.picture,
    nip05: profile.nip05,
    banner: profile.banner,
    website: profile.website,
  }
}
