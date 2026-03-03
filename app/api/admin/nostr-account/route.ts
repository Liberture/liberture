import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isAdmin } from "@/lib/auth";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";

// bech32 alphabet
const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

/**
 * Extract pubkey hex from bunker:// URL
 */
function extractPubkeyFromBunkerUrl(url: string): string {
  if (!url.startsWith("bunker://")) {
    throw new Error("Invalid bunker URL");
  }
  // Format: bunker://<pubkey>?relay=...
  const withoutPrefix = url.slice(9); // Remove "bunker://"
  const pubkey = withoutPrefix.split("?")[0];
  
  if (!/^[0-9a-f]{64}$/i.test(pubkey)) {
    throw new Error("Invalid pubkey in bunker URL");
  }
  return pubkey.toLowerCase();
}

/**
 * Convert hex pubkey to npub using bech32 encoding.
 */
function hexToNpub(hex: string): string {
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("Invalid hex pubkey");
  }

  // Convert hex to bytes
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

  // Convert 8-bit to 5-bit
  const data: number[] = [];
  let acc = 0;
  let bits = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      data.push((acc >> bits) & 0x1f);
    }
  }
  if (bits > 0) {
    data.push((acc << (5 - bits)) & 0x1f);
  }

  // Calculate checksum
  const hrp = "npub";
  const checksum = bech32Checksum(hrp, data);
  const combined = [...data, ...checksum];

  // Encode to bech32
  return hrp + "1" + combined.map(d => BECH32_ALPHABET[d]).join("");
}

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) {
        chk ^= GEN[i];
      }
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (const c of hrp) {
    ret.push(c.charCodeAt(0) >> 5);
  }
  ret.push(0);
  for (const c of hrp) {
    ret.push(c.charCodeAt(0) & 31);
  }
  return ret;
}

function bech32Checksum(hrp: string, data: number[]): number[] {
  const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const polymod = bech32Polymod(values) ^ 1;
  const checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((polymod >> (5 * (5 - i))) & 31);
  }
  return checksum;
}

/**
 * Convert npub to hex pubkey using bech32 decoding.
 */
function npubToHex(npub: string): string {
  if (!npub.startsWith("npub1")) {
    throw new Error("Invalid npub format");
  }
  
  const data = npub.slice(5); // Remove "npub1" prefix
  const decoded: number[] = [];
  
  for (const char of data) {
    const index = BECH32_ALPHABET.indexOf(char);
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
// Public access allowed (only returns npub, no secrets)
// Admin access returns full details
export async function GET() {
  try {
    const user = await getAuthUser();
    
    const account = await prisma.nostrAccount.findFirst({
      where: { role: "liberture" },
      select: {
        id: true,
        npub: true,
        pubkeyHex: true,
        role: true,
        nbunkerUrl: true,
        nbunkerSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return NextResponse.json({ account: null });
    }

    // For non-authenticated or non-admin users, only return public info
    const isUserAdmin = user ? await isAdmin(user.userId) : false;
    
    if (!isUserAdmin) {
      return NextResponse.json({
        account: {
          npub: account.npub,
          pubkeyHex: account.pubkeyHex,
        },
      });
    }

    // Admin gets full details (but still no secret)
    return NextResponse.json({
      account: {
        ...account,
        nbunkerSecret: undefined, // Never send the actual secret
        hasSecret: !!account.nbunkerSecret,
      },
    });
  } catch (error) {
    console.error("Failed to load nostr account:", error);
    return NextResponse.json(
      { error: "Failed to load account" },
      { status: 500 }
    );
  }
}

// POST — Upsert the NostrAccount (npub + nbunkerUrl + nbunkerSecret)
// Admin only
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.userId);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    let { npub, nbunkerUrl, nbunkerSecret } = body;

    let pubkeyHex: string;

    // If bunker URL provided, extract pubkey from it
    if (nbunkerUrl && nbunkerUrl.startsWith("bunker://")) {
      try {
        const pubkeyFromBunker = extractPubkeyFromBunkerUrl(nbunkerUrl);
        pubkeyHex = pubkeyFromBunker;
        npub = hexToNpub(pubkeyHex);
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid bunker URL format" },
          { status: 400 }
        );
      }
    } else if (npub && npub.startsWith("npub1")) {
      // Convert npub to hex
      try {
        pubkeyHex = npubToHex(npub);
      } catch (e) {
        return NextResponse.json({ error: "Invalid npub format" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Either a valid bunker URL or npub is required" },
        { status: 400 }
      );
    }

    // Build update data - only update secret if provided
    const updateData: {
      npub: string;
      pubkeyHex: string;
      nbunkerUrl: string | null;
      nbunkerSecret?: string | null;
    } = {
      npub,
      pubkeyHex,
      nbunkerUrl: nbunkerUrl || null,
    };

    // Only update secret if a new value is provided
    if (nbunkerSecret) {
      try {
        updateData.nbunkerSecret = encrypt(nbunkerSecret);
      } catch (e) {
        console.error("Encryption failed:", e);
        return NextResponse.json(
          { error: "Failed to encrypt secret. Check ENCRYPTION_KEY env var." },
          { status: 500 }
        );
      }
    }

    // Find existing account by role (not npub, since npub can change)
    const existingAccount = await prisma.nostrAccount.findFirst({
      where: { role: "liberture" },
    });

    let account;
    if (existingAccount) {
      account = await prisma.nostrAccount.update({
        where: { id: existingAccount.id },
        data: updateData,
      });
    } else {
      account = await prisma.nostrAccount.create({
        data: {
          npub,
          pubkeyHex,
          role: "liberture",
          nbunkerUrl: nbunkerUrl || null,
          nbunkerSecret: nbunkerSecret || null,
        },
      });
    }

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
