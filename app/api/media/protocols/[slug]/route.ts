import { NextResponse } from "next/server"
import { directoryApiClient } from "@/lib/i18n/directory-records.server"

// Used by the static tracker catalog and old assistant links. Image bytes are
// served by object storage, never fetched or resized by the application server.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const record = await directoryApiClient(request).protocol.findUnique({
    where: { slug, published: true }, select: { imageUrl: true, previewImageUrl: true },
  })
  const preview = new URL(request.url).searchParams.get("variant") === "preview"
  const src = preview ? record?.previewImageUrl || record?.imageUrl : record?.imageUrl
  if (!src) return new NextResponse(null, { status: 404 })
  const response = NextResponse.redirect(new URL(src, request.url), 307)
  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60")
  return response
}
