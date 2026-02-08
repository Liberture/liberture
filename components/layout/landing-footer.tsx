import Link from "next/link"

import { MicroterrainRidge } from "@/components/patterns"
import { translations } from "@/lib/translations"
import { LibertureLogo } from "@/components/branding/LibertureLogo"

export function LandingFooter() {
  const { brand } = translations.en
  const { footer } = translations.en.landing
  return (
    <footer className="relative overflow-hidden py-12 px-4 border-t border-border/50">
      <MicroterrainRidge placement="full" gradient="magma" className="inset-0" opacity={0.12} />
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 group mb-4">
              <LibertureLogo size={40} animate={false} />
              <span className="text-lg font-bold tracking-tight">{brand.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">{brand.tagline}</p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <div className="flex flex-col gap-2">
              <Link href="/directory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Directory
              </Link>
              <Link href="/people" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                People
              </Link>
              <Link href="/organizations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Organizations
              </Link>
              <Link href="/protocols" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Protocols
              </Link>
              <Link href="/books" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Books
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {footer.privacy}
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {footer.terms}
              </Link>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-3">Connect</h3>
            <div className="flex flex-col gap-2">
              <Link href="https://x.com/liberture" target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Twitter/X
              </Link>
              <Link href="https://linkedin.com/company/liberture" target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                LinkedIn
              </Link>
              <Link href="https://instagram.com/liberture" target="_blank" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Instagram
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
