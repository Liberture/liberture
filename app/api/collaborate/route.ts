import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCollaborationDM } from "@/lib/nostr-dm";

const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

/**
 * Convert npub to hex pubkey using bech32 decoding.
 */
function npubToHex(npub: string): string {
  if (!npub.startsWith("npub1")) {
    throw new Error("Invalid npub format");
  }
  
  const data = npub.slice(5);
  const decoded: number[] = [];
  
  for (const char of data) {
    const index = BECH32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid character in npub");
    decoded.push(index);
  }
  
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
  
  const withoutChecksum = result.slice(0, 32);
  return withoutChecksum.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert hex pubkey to npub using bech32 encoding.
 */
function hexToNpub(hex: string): string {
  // Convert hex to bytes
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

  // Convert 8-bit bytes to 5-bit groups
  let acc = 0;
  let bits = 0;
  const data: number[] = [];
  
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      data.push((acc >> bits) & 31);
    }
  }
  if (bits > 0) {
    data.push((acc << (5 - bits)) & 31);
  }

  // Calculate bech32 checksum
  const hrp = "npub";
  const values = [...data];
  
  function polymod(values: number[]): number {
    const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
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

  function hrpExpand(hrp: string): number[] {
    const result: number[] = [];
    for (const c of hrp) {
      result.push(c.charCodeAt(0) >> 5);
    }
    result.push(0);
    for (const c of hrp) {
      result.push(c.charCodeAt(0) & 31);
    }
    return result;
  }

  const checksumInput = [...hrpExpand(hrp), ...values, 0, 0, 0, 0, 0, 0];
  const checksumValue = polymod(checksumInput) ^ 1;
  const checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((checksumValue >> (5 * (5 - i))) & 31);
  }

  const encoded = [...values, ...checksum]
    .map((v) => BECH32_ALPHABET[v])
    .join("");

  return `${hrp}1${encoded}`;
}

/**
 * Check if string is valid hex pubkey (64 hex chars).
 */
function isValidHexPubkey(hex: string): boolean {
  return /^[0-9a-f]{64}$/i.test(hex);
}

/**
 * Validate npub format (basic check).
 */
function isValidNpub(npub: string): boolean {
  if (!npub.startsWith("npub1")) return false;
  if (npub.length !== 63) return false; // npub1 + 58 chars
  
  for (const char of npub.slice(5)) {
    if (!BECH32_ALPHABET.includes(char)) return false;
  }
  
  return true;
}

/**
 * Normalize pubkey input to both npub and hex formats.
 * Accepts either npub or hex pubkey.
 */
function normalizePubkey(input: string): { npub: string; hex: string } | null {
  const trimmed = input.trim().toLowerCase();
  
  if (isValidNpub(trimmed)) {
    try {
      return { npub: trimmed, hex: npubToHex(trimmed) };
    } catch {
      return null;
    }
  }
  
  if (isValidHexPubkey(trimmed)) {
    try {
      return { npub: hexToNpub(trimmed), hex: trimmed };
    } catch {
      return null;
    }
  }
  
  return null;
}

// POST — Submit a collaboration request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { npub: pubkeyInput, message } = body;

    // Validate pubkey (accepts npub or hex)
    if (!pubkeyInput || typeof pubkeyInput !== "string") {
      return NextResponse.json(
        { error: "Pubkey is required" },
        { status: 400 }
      );
    }

    // Normalize to both formats
    const normalized = normalizePubkey(pubkeyInput);
    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid pubkey format. Provide either an npub or 64-character hex pubkey." },
        { status: 400 }
      );
    }

    const { npub: normalizedNpub, hex: pubkeyHex } = normalized;

    // Validate message (optional, max 500 chars)
    const trimmedMessage = message?.trim().slice(0, 500) || null;

    // Check if already a collaborator (check both npub and hex)
    const existingCollaborator = await prisma.collaborator.findFirst({
      where: {
        OR: [
          { npub: normalizedNpub },
          { pubkeyHex: pubkeyHex },
        ],
      },
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "You're already a collaborator!" },
        { status: 409 }
      );
    }

    // Check if request already exists (check both npub and hex)
    const existingRequest = await prisma.collaborationRequest.findFirst({
      where: {
        OR: [
          { npub: normalizedNpub },
          { pubkeyHex: pubkeyHex },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "You already have a pending request. We'll review it soon!" },
          { status: 409 }
        );
      }
      if (existingRequest.status === "rejected") {
        return NextResponse.json(
          { error: "Your previous request was not approved. Please contact us directly if you'd like to discuss." },
          { status: 409 }
        );
      }
    }

    // Create the request
    const collabRequest = await prisma.collaborationRequest.create({
      data: {
        npub: normalizedNpub,
        pubkeyHex,
        message: trimmedMessage,
        status: "pending",
      },
    });

    // Send Nostr DM if there's a message
    let dmSent = false;
    if (trimmedMessage) {
      try {
        const dmResult = await sendCollaborationDM(trimmedMessage, normalizedNpub);
        dmSent = dmResult.success;
        if (!dmResult.success) {
          console.warn("Failed to send collaboration DM:", dmResult.errors);
        }
      } catch (e) {
        console.warn("Failed to send collaboration DM:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: dmSent 
        ? "Request submitted and message sent via Nostr DM! We'll review it soon."
        : "Request submitted successfully! We'll review it soon.",
      requestId: collabRequest.id,
      dmSent,
    });
  } catch (error) {
    console.error("Failed to submit collaboration request:", error);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
