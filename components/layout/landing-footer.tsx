import { Github, Instagram, Linkedin } from "lucide-react"
import { BrandMark, SocialIcon } from "@/components/ui/social-icon"
import Link from "@/components/i18n/localized-link"

import { MicroterrainRidge } from "@/components/patterns"
import { useMessages } from "next-intl"
import type { Catalog } from "@/lib/translations"
import { LibertureWordmark } from "@/components/branding/LibertureWordmark"

const linkClass = "text-sm text-muted-foreground hover:text-foreground transition-colors"

const SOCIAL = [
  { href: "https://github.com/liberture/liberture", label: "GitHub · liberture/liberture", icon: <Github /> },
  { href: "https://medium.com/liberture", label: "Medium · @liberture", icon: <BrandMark brand="medium" /> },
  { href: "https://x.com/liberture", label: "X · @liberture", icon: <BrandMark brand="x" /> },
  { href: "https://linkedin.com/company/liberture", label: "LinkedIn · @liberture", icon: <Linkedin /> },
  { href: "https://instagram.com/liberture", label: "Instagram · @liberture", icon: <Instagram /> },
]

export function LandingFooter() {
  const t = useMessages() as unknown as Catalog
  const { brand } = t
  const { pillars } = t.common
  const f = t.habits.site.footer

  const columns = [
    {
      title: f.assistant,
      links: [
        { href: "/tracker", label: f.tracker },
        { href: "/#how-it-works", label: f.howItWorks },
        { href: "/guides", label: f.guides },
        { href: "/docs", label: f.docs },
        { href: "/docs/permissions", label: f.permissions },
        { href: "/docs/api", label: f.api },
      ],
    },
    {
      title: f.resources,
      links: [
        { href: "/directory", label: f.directory },
        { href: "/people", label: f.people },
        { href: "/projects", label: t.habits.app.directoryProfiles.projects },
        { href: "/organizations", label: f.organizations },
        { href: "/protocols", label: f.protocols },
        { href: "/books", label: f.books },
      ],
    },
    {
      title: f.company,
      links: [
        { href: "/about", label: f.about },
        { href: "/contact", label: f.contact },
        { href: "/support", label: f.support },
        { href: "/privacy", label: f.privacy },
        { href: "/terms", label: f.terms },
      ],
    },
  ]

  return (
    <footer className="relative overflow-hidden py-12 px-4 border-t border-border/50">
      <MicroterrainRidge placement="full" gradient="magma" className="inset-0" opacity={0.12} />
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center group mb-4">
              <LibertureWordmark height={28} />
            </Link>
            <p className="text-sm text-muted-foreground">{f.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {SOCIAL.map(s => <SocialIcon key={s.href} href={s.href} label={s.label}>{s.icon}</SocialIcon>)}
            </div>
          </div>

          {/* Pillars */}
          <div>
            <h3 className="font-semibold mb-3">{f.pillars}</h3>
            <div className="flex flex-col gap-2">
              {pillars.map((pillar) => (
                <Link key={pillar.id} href={`/pillars/${pillar.id}`} className={linkClass}>
                  {pillar.name}
                </Link>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold mb-3">{column.title}</h3>
              <div className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}


        </div>

        <div className="border-t border-border/50 pt-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. {f.allRights}
          </p>
        </div>
      </div>
    </footer>
  )
}
