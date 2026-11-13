import type { Metadata } from "next"

import { currentPageAlternates } from "@/lib/i18n/route-metadata.server"

export async function detailMetadata(path: string, title: string, text: string, type: "book" | "article" | "profile" | "website", picture?: string | null): Promise<Metadata> {
  const alternates = await currentPageAlternates()
  const url = alternates?.canonical ?? new URL(path, "https://liberture.com").href
  const description = text.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\[\d+\]|[*#]/g,"").replace(/\s+/g," ").trim().slice(0,160)
  const images = [picture || "/og-image.jpg"]
  return { title, description, alternates: alternates ?? {canonical:url}, openGraph: { type, title, description, url, images, siteName:"Liberture" }, twitter: { card:"summary_large_image", title, description, images } }
}
