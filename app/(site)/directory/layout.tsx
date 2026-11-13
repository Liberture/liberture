import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
export function generateMetadata() {
  return publicPageMetadata("/directory", "directory")
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
