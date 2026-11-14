import { NextResponse } from "next/server"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { uploadImage } from "@/lib/media/storage"

export const runtime = "nodejs"
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user || !await isAdmin(user.userId)) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  // Bounded stream, including requests without Content-Length.
  const reader = request.body?.getReader()
  if (!reader) return NextResponse.json({ error: "Image required" }, { status: 400 })
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    length += value.length
    if (length > 10 * 1024 * 1024) { await reader.cancel(); return NextResponse.json({ error: "Image too large" }, { status: 413 }) }
    chunks.push(value)
  }
  if (!length || !["image/png", "image/jpeg", "image/webp"].includes(request.headers.get("content-type") || "")) return NextResponse.json({ error: "Unsupported image" }, { status: 400 })
  try {
    const url = await uploadImage(Buffer.concat(chunks), new URL(request.url).searchParams.get("variant") === "preview")
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Media upload failed", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Could not upload image" }, { status: 422 })
  }
}
