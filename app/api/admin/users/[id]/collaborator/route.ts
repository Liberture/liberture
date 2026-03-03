import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isAdmin } from "@/lib/auth";

// DELETE — Revoke collaborator status
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Get user's pubkey
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nostrPubkey: true },
    });

    if (!user?.nostrPubkey) {
      return NextResponse.json(
        { error: "User not found or has no Nostr pubkey" },
        { status: 404 }
      );
    }

    // Find and delete collaborator record
    const collaborator = await prisma.collaborator.findFirst({
      where: {
        OR: [
          { pubkeyHex: user.nostrPubkey },
          { pubkeyHex: user.nostrPubkey.toLowerCase() },
        ],
      },
    });

    if (!collaborator) {
      return NextResponse.json(
        { error: "User is not a collaborator" },
        { status: 404 }
      );
    }

    // Delete the collaborator record
    await prisma.collaborator.delete({
      where: { id: collaborator.id },
    });

    // Also update their collaboration request to rejected (so they can't just re-request)
    await prisma.collaborationRequest.updateMany({
      where: {
        OR: [
          { pubkeyHex: user.nostrPubkey },
          { pubkeyHex: user.nostrPubkey.toLowerCase() },
        ],
      },
      data: {
        status: "revoked",
        reviewedAt: new Date(),
        reviewedBy: authUser.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Collaborator status revoked",
    });
  } catch (error) {
    console.error("Failed to revoke collaborator:", error);
    return NextResponse.json(
      { error: "Failed to revoke collaborator status" },
      { status: 500 }
    );
  }
}

// POST — Grant collaborator status directly (without request)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await isAdmin(authUser.userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Get user's pubkey
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nostrPubkey: true, name: true },
    });

    if (!user?.nostrPubkey) {
      return NextResponse.json(
        { error: "User not found or has no Nostr pubkey" },
        { status: 404 }
      );
    }

    // Check if already a collaborator
    const existing = await prisma.collaborator.findFirst({
      where: {
        OR: [
          { pubkeyHex: user.nostrPubkey },
          { pubkeyHex: user.nostrPubkey.toLowerCase() },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a collaborator" },
        { status: 409 }
      );
    }

    // Create npub from hex
    const npub = hexToNpub(user.nostrPubkey);

    // Create collaborator record
    await prisma.collaborator.create({
      data: {
        npub,
        pubkeyHex: user.nostrPubkey,
        displayName: user.name,
        isActive: true,
        approvedAt: new Date(),
        approvedBy: authUser.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Collaborator status granted",
    });
  } catch (error) {
    console.error("Failed to grant collaborator:", error);
    return NextResponse.json(
      { error: "Failed to grant collaborator status" },
      { status: 500 }
    );
  }
}

// Helper: Convert hex to npub
function hexToNpub(hex: string): string {
  const BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

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
