import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// Liberture's official Nostr account
const LIBERTURE_NPUB = "npub1m9vsm9d8sy0pevcjhenwm4ny6l37dm2hsg4dnusna43ql3n5305qy4zlg4";

/**
 * Convert npub to hex pubkey using bech32 decoding.
 * This is a simple implementation that doesn't require nostr-tools.
 */
function npubToHex(npub: string): string {
  // bech32 alphabet
  const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  
  if (!npub.startsWith("npub1")) {
    throw new Error("Invalid npub format");
  }
  
  const data = npub.slice(5); // Remove "npub1" prefix
  const decoded: number[] = [];
  
  for (const char of data) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid character in npub");
    decoded.push(index);
  }
  
  // Convert from 5-bit to 8-bit
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  
  for (const value of decoded) {
    acc = (acc << 5) | value;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      result.push((acc >> bits) & 0xff);
    }
  }
  
  // Remove checksum (last 6 characters = 30 bits, but we already removed during conversion)
  // Actually bech32 checksum is 6 chars at the end, we need to remove the last few bytes
  const withoutChecksum = result.slice(0, 32);
  
  return withoutChecksum.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// GET — Return current NostrAccount for role="liberture"
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.nostrAccount.findFirst({
      where: { role: "liberture" },
      select: {
        id: true,
        npub: true,
        pubkeyHex: true,
        role: true,
        nbunkerUrl: true,
        nbunkerSecret: true, // Will mask this in response
        createdAt: true,
        updatedAt: true,
      },
    });

    if (account) {
      return NextResponse.json({
        account: {
          ...account,
          nbunkerSecret: undefined, // Never send the actual secret
          hasSecret: !!account.nbunkerSecret,
        },
      });
    }

    return NextResponse.json({ account: null });
  } catch (error) {
    console.error("Failed to load nostr account:", error);
    return NextResponse.json(
      { error: "Failed to load account" },
      { status: 500 }
    );
  }
}

// POST — Upsert the NostrAccount (npub + nbunkerUrl + nbunkerSecret)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { npub, nbunkerUrl, nbunkerSecret } = body;

    // Validate npub
    if (npub !== LIBERTURE_NPUB) {
      return NextResponse.json(
        { error: "Invalid npub - must use Liberture's official account" },
        { status: 400 }
      );
    }

    // Convert npub to hex
    let pubkeyHex: string;
    try {
      pubkeyHex = npubToHex(npub);
    } catch (e) {
      return NextResponse.json({ error: "Invalid npub format" }, { status: 400 });
    }

    // Build update data - only update secret if provided
    const updateData: {
      nbunkerUrl: string | null;
      nbunkerSecret?: string | null;
    } = {
      nbunkerUrl: nbunkerUrl || null,
    };

    // Only update secret if a new value is provided
    if (nbunkerSecret) {
      // NOTE: In production, this should be encrypted before storing
      updateData.nbunkerSecret = nbunkerSecret;
    }

    const account = await prisma.nostrAccount.upsert({
      where: { npub },
      update: updateData,
      create: {
        npub,
        pubkeyHex,
        role: "liberture",
        nbunkerUrl: nbunkerUrl || null,
        nbunkerSecret: nbunkerSecret || null,
      },
    });

    return NextResponse.json({
      account: {
        id: account.id,
        npub: account.npub,
        pubkeyHex: account.pubkeyHex,
        role: account.role,
        nbunkerUrl: account.nbunkerUrl,
        hasSecret: !!account.nbunkerSecret,
      },
    });
  } catch (error) {
    console.error("Failed to save nostr account:", error);
    return NextResponse.json(
      { error: "Failed to save account" },
      { status: 500 }
    );
  }
}
