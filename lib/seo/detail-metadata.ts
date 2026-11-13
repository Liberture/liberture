import type { Metadata } from "next"

export function detailMetadata(path: string, title: string, text: string, type: "book" | "article" | "profile" | "website", picture?: string | null): Metadata {
  const url = new URL(path, "https://liberture.com").href
  const description = text.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/\[\d+\]|[*#]/g,"").replace(/\s+/g," ").trim().slice(0,160)
  const images = [picture || "/og-image.jpg"]
  return { title, description, alternates: {canonical:url}, openGraph: { type, title, description, url, images, siteName:"Liberture" }, twitter: { card:"summary_large_image", title, description, images } }
}
