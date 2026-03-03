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
    () => fetchFromPurplepages(pubkey),
    () => fetchFromPrimal(pubkey),
  ]

  for (const source of sources) {
    try {
      const profile = await source()
      if (profile) return NextResponse.json({ profile })
    } catch (e) {
      // try next
    }
  }

  return NextResponse.json({ profile: null })
}

async function fetchFromPurplepages(pubkey: string) {
  // purplepag.es is a dedicated kind 0 caching service
  const res = await fetch(`https://purplepag.es/api/${pubkey}/info`, {
    signal: AbortSignal.timeout(4000),
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  const data = await res.json()
  // purplepag.es returns the kind 0 content directly
  return {
    name: data.name || data.display_name,
    about: data.about,
    picture: data.picture,
    nip05: data.nip05,
    banner: data.banner,
    website: data.website,
  }
}

async function fetchFromPrimal(pubkey: string) {
  // Primal has a REST-like cache API
  const res = await fetch(`https://primal.net/api1?userid=${pubkey}`, {
    signal: AbortSignal.timeout(4000),
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  const data = await res.json()

  // Primal returns array of events — find kind 0
  const events = Array.isArray(data) ? data : data?.events || []
  const kind0 = events.find((e: any) => e.kind === 0)
  if (!kind0) return null

  const metadata = JSON.parse(kind0.content)
  return {
    name: metadata.name || metadata.display_name,
    about: metadata.about,
    picture: metadata.picture,
    nip05: metadata.nip05,
    banner: metadata.banner,
    website: metadata.website,
  }
}
