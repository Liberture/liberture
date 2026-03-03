import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isAdmin } from "@/lib/auth";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";

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
    const { npub, nbunkerUrl, nbunkerSecret } = body;

    // Validate npub format
    if (!npub || !npub.startsWith("npub1")) {
      return NextResponse.json(
        { error: "Invalid npub format — must start with npub1" },
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
