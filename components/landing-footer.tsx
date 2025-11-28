import Link from "next/link"

import { MicroterrainRidge } from "@/components/patterns"
import { translations } from "@/lib/translations"

export function LandingFooter() {
  const { brand } = translations.en
  const { footer } = translations.en.landing
  return (
    <footer className="relative overflow-hidden py-12 px-4 border-t border-border/50">
      <MicroterrainRidge placement="full" gradient="magma" className="inset-0" opacity={0.12} />
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-xs">{brand.abbreviation}</span>
            </div>
            <span className="font-semibold">{brand.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. {brand.tagline}.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {footer.privacy}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
