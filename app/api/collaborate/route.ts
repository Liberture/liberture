import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Convert npub to hex pubkey using bech32 decoding.
 */
function npubToHex(npub: string): string {
  const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  
  if (!npub.startsWith("npub1")) {
    throw new Error("Invalid npub format");
  }
  
  const data = npub.slice(5);
  const decoded: number[] = [];
  
  for (const char of data) {
    const index = ALPHABET.indexOf(char);
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
 * Validate npub format (basic check).
 */
function isValidNpub(npub: string): boolean {
  if (!npub.startsWith("npub1")) return false;
  if (npub.length !== 63) return false; // npub1 + 58 chars
  
  const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  for (const char of npub.slice(5)) {
    if (!ALPHABET.includes(char)) return false;
  }
  
  return true;
}

// POST — Submit a collaboration request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { npub, message } = body;

    // Validate npub
    if (!npub || typeof npub !== "string") {
      return NextResponse.json(
        { error: "npub is required" },
        { status: 400 }
      );
    }

    const trimmedNpub = npub.trim().toLowerCase();

    if (!isValidNpub(trimmedNpub)) {
      return NextResponse.json(
        { error: "Invalid npub format. It should start with 'npub1' and be 63 characters long." },
        { status: 400 }
      );
    }

    // Validate message (optional, max 500 chars)
    const trimmedMessage = message?.trim().slice(0, 500) || null;

    // Convert npub to hex
    let pubkeyHex: string;
    try {
      pubkeyHex = npubToHex(trimmedNpub);
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to decode npub" },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const existingCollaborator = await prisma.collaborator.findUnique({
      where: { npub: trimmedNpub },
    });

    if (existingCollaborator) {
      return NextResponse.json(
        { error: "You're already a collaborator!" },
        { status: 409 }
      );
    }

    // Check if request already exists
    const existingRequest = await prisma.collaborationRequest.findUnique({
      where: { npub: trimmedNpub },
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
        npub: trimmedNpub,
        pubkeyHex,
        message: trimmedMessage,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Request submitted successfully! We'll review it soon.",
      requestId: collabRequest.id,
    });
  } catch (error) {
    console.error("Failed to submit collaboration request:", error);
    return NextResponse.json(
      { error: "Failed to submit request. Please try again." },
      { status: 500 }
    );
  }
}
