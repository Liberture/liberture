import { NextResponse } from "next/server";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
  "wss://relay.primal.net",
];

const TIMEOUT_MS = 5000;

interface NostrProfile {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
}

/**
 * Fetch kind 0 metadata events from a single relay for given pubkeys.
 */
function fetchFromRelay(
  relayUrl: string,
  pubkeys: string[]
): Promise<Map<string, NostrProfile>> {
  const profiles = new Map<string, NostrProfile>();

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      resolve(profiles);
    }, TIMEOUT_MS);

    let ws: WebSocket;
    try {
      ws = new WebSocket(relayUrl);
    } catch {
      clearTimeout(timer);
      resolve(profiles);
      return;
    }

    ws.onopen = () => {
      const filter = { kinds: [0], authors: pubkeys };
      ws.send(JSON.stringify(["REQ", "profiles", filter]));
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(typeof msg.data === "string" ? msg.data : String(msg.data));
        if (data[0] === "EVENT" && data[2]) {
          const event = data[2];
          if (event.kind === 0 && event.pubkey && event.content) {
            if (!profiles.has(event.pubkey)) {
              profiles.set(event.pubkey, JSON.parse(event.content));
            }
          }
        }
        if (data[0] === "EOSE") {
          clearTimeout(timer);
          try { ws.close(); } catch {}
          resolve(profiles);
        }
      } catch {}
    };

    ws.onerror = () => {
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve(profiles);
    };
  });
}

export async function POST(request: Request) {
  try {
    const { pubkeys } = (await request.json()) as { pubkeys: string[] };

    if (!pubkeys || !Array.isArray(pubkeys) || pubkeys.length === 0) {
      return NextResponse.json({ profiles: {} });
    }

    // Query all relays in parallel
    const results = await Promise.allSettled(
      RELAYS.map((relay) => fetchFromRelay(relay, pubkeys))
    );

    // Merge results, preferring profiles with pictures
    const merged: Record<string, NostrProfile> = {};
    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const [pubkey, profile] of result.value) {
          const existing = merged[pubkey];
          if (!existing || (!existing.picture && profile.picture)) {
            merged[pubkey] = profile;
          }
        }
      }
    }

    return NextResponse.json({ profiles: merged });
  } catch (error) {
    console.error("Failed to fetch Nostr profiles:", error);
    return NextResponse.json({ profiles: {} });
  }
}
