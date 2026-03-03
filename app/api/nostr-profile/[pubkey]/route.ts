import { NextRequest, NextResponse } from 'next/server'

const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://purplepag.es',
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pubkey: string }> }
) {
  const { pubkey } = await params

  if (!pubkey || !/^[0-9a-f]{64}$/i.test(pubkey)) {
    return NextResponse.json({ error: 'Invalid pubkey' }, { status: 400 })
  }

  try {
    const profile = await fetchProfileFromRelays(pubkey)
    return NextResponse.json({ profile })
  } catch (e) {
    console.error('Profile fetch error:', e)
    return NextResponse.json({ profile: null })
  }
}

async function fetchProfileFromRelays(pubkey: string): Promise<any> {
  // Query multiple relays in parallel, return first valid kind 0
  const results = await Promise.allSettled(
    RELAYS.map(relay => fetchFromRelay(relay, pubkey))
  )

  // Find the most recent kind 0 event
  let bestProfile: any = null
  let bestCreatedAt = 0

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      if (result.value.created_at > bestCreatedAt) {
        bestCreatedAt = result.value.created_at
        bestProfile = result.value.profile
      }
    }
  }

  return bestProfile
}

async function fetchFromRelay(relayUrl: string, pubkey: string): Promise<{ profile: any; created_at: number } | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      ws.close()
      resolve(null)
    }, 5000)

    let ws: WebSocket
    try {
      ws = new WebSocket(relayUrl)
    } catch {
      clearTimeout(timeout)
      resolve(null)
      return
    }

    const subId = Math.random().toString(36).substring(2, 10)

    ws.onopen = () => {
      // Request kind 0 (metadata) for this pubkey
      const req = JSON.stringify([
        'REQ',
        subId,
        { kinds: [0], authors: [pubkey], limit: 1 }
      ])
      ws.send(req)
    }

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data)
        
        // EVENT message
        if (data[0] === 'EVENT' && data[1] === subId && data[2]) {
          const event = data[2]
          if (event.kind === 0 && event.pubkey === pubkey) {
            const content = JSON.parse(event.content)
            clearTimeout(timeout)
            ws.close()
            resolve({
              profile: {
                name: content.name || content.display_name || content.displayName,
                about: content.about,
                picture: content.picture || content.image,
                nip05: content.nip05,
                banner: content.banner,
                website: content.website,
                lud16: content.lud16,
                lud06: content.lud06,
              },
              created_at: event.created_at
            })
          }
        }
        
        // EOSE - end of stored events
        if (data[0] === 'EOSE' && data[1] === subId) {
          clearTimeout(timeout)
          ws.close()
          resolve(null)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      ws.close()
      resolve(null)
    }

    ws.onclose = () => {
      clearTimeout(timeout)
      resolve(null)
    }
  })
}
