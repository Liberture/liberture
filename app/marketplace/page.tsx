import { MarketplaceContent } from "@/components/marketplace-content"
import { LandingNav } from "@/components/landing-nav"
import { LandingFooter } from "@/components/landing-footer"
import { AuthProvider } from "@/lib/auth-context"

export default function MarketplacePage() {
  return (
    <AuthProvider>
      <main className="min-h-screen topo-pattern">
        <LandingNav />
        <div className="pt-20">
          <MarketplaceContent />
        </div>
        <LandingFooter />
      </main>
    </AuthProvider>
  )
}
