import { MarketplaceContent } from "./marketplace-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Marketplace | Premium Resources & Courses | Liberture",
  description: "Discover premium courses, coaching, books, videos, and open-source resources for human optimization across all six pillars.",
  openGraph: {
    title: "Marketplace | Liberture",
    description: "Premium courses, coaching, and resources for human optimization across Cognition, Recovery, Fueling, Mental, Physicality, and Finance.",
    url: "https://liberture.com/marketplace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace | Liberture",
    description: "Premium courses, coaching, and resources for human optimization.",
  },
}

export default function MarketplacePage() {
  return (
    <div className="pt-4">
      <MarketplaceContent />
    </div>
  )
}
