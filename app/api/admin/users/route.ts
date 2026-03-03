import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Convert hex pubkey to npub
function hexToNpub(hex: string): string {
  const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  
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
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  
  function polymod(values: number[]): number {
    let chk = 1;
    for (const v of values) {
      const top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ v;
      for (let i = 0; i < 5; i++) {
        if ((top >> i) & 1) chk ^= GEN[i];
      }
    }
    return chk;
  }
  
  const hrpExpand = [...hrp].map(c => c.charCodeAt(0) >> 5)
    .concat([0])
    .concat([...hrp].map(c => c.charCodeAt(0) & 31));
  
  const values = [...hrpExpand, ...data, 0, 0, 0, 0, 0, 0];
  const polymodResult = polymod(values) ^ 1;
  const checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((polymodResult >> (5 * (5 - i))) & 31);
  }

  return hrp + "1" + [...data, ...checksum].map(d => BECH32_ALPHABET[d]).join("");
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bosLevel: true,
        banned: true,
        banReason: true,
        nostrPubkey: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform users to include npub
    const transformedUsers = users.map(user => ({
      ...user,
      npub: user.nostrPubkey ? hexToNpub(user.nostrPubkey) : null,
      // Hide fake email if it's a nostr-generated one
      email: user.email?.endsWith('@nostr.liberture.com') ? null : user.email,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("Failed to load users:", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}
