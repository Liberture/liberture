import { LandingFooter } from "@/components/landing-footer"
import { LandingNav } from "@/components/landing-nav"
import { TopographicBackground } from "@/components/topographic-background"
import { AuthProvider } from "@/lib/auth-context"
import { MarketplaceContent } from "./marketplace-content"

export default function MarketplacePage() {
  return (
    <AuthProvider>
      <main className="min-h-screen topo-pattern">
        <TopographicBackground />
        <LandingNav />
        <div className="pt-20">
          <MarketplaceContent />
        </div>
        <LandingFooter />
      </main>
    </AuthProvider>
  )
}
