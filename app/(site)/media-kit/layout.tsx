import { publicPageMetadata } from "@/lib/seo/public-page-metadata"

export function generateMetadata() {
  return publicPageMetadata("/media-kit", "mediaKit")
}

export default function MediaKitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
