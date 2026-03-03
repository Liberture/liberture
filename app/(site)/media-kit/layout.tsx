import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Media Kit | Brand Assets & Guidelines | Liberture",
  description: "Download Liberture brand assets including logos, colors, typography, and banners. Access press materials and usage guidelines.",
  openGraph: {
    title: "Media Kit | Liberture",
    description: "Download brand assets, logos, colors, and press materials for Liberture.",
    url: "https://liberture.com/media-kit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Media Kit | Liberture",
    description: "Download brand assets and press materials for Liberture.",
  },
}

export default function MediaKitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
