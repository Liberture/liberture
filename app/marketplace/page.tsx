import { MarketplaceContent } from "@/components/marketplace-content"
import { LandingNav } from "@/components/landing-nav"
import { LandingFooter } from "@/components/landing-footer"
import { AuthProvider } from "@/lib/auth-context"
import { TopographicBackground } from "@/components/topographic-background"

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
