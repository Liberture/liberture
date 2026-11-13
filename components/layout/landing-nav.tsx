"use client"

import { useEffect, useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { AccountMenuTrigger } from "@/components/habits/account-header"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, ChevronDown, User, Shield } from "lucide-react"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { useHabitsSession } from "@/components/habits/session-provider"
import { LanguageSwitch } from "@/components/habits/site/language-switch"
import { LibertureLogo } from "@/components/branding"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"

/** Admin status comes from the server, which holds the admin key list. */
function useAccountSummary(signedIn: boolean, pubkey: string | null) {
  const [account, setAccount] = useState<{ isAdmin: boolean; name: string | null } | null>(null)
  useEffect(() => {
    if (!signedIn) {
      setAccount(null)
      return
    }
    let cancelled = false
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setAccount(d?.user ?? null))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [signedIn, pubkey])
  return account
}

export function LandingNav() {
  const locale = useLocale()
  const t = useTranslations()
  const { brand } = t
  const { pillars } = t.common
  const nav = t.habits.site.nav
  const { auth, isSignedIn, openSignIn, logout } = useHabitsSession()
  const account = useAccountSummary(isSignedIn, auth.pubkey)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pillarsDropdownOpen, setPillarsDropdownOpen] = useState(false)

  const itemClass = "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-secondary"
  const accountMenu = (
    <DropdownMenu.Root>
      <AccountMenuTrigger pubkey={auth.pubkey} fallbackName={account?.name} />
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} collisionPadding={8} className="lb-dropdown z-50 min-w-44 p-1">
          <DropdownMenu.Item asChild onSelect={() => setMobileMenuOpen(false)}>
            <Link className={itemClass} href="/tracker"><User size={16} />{nav.tracker}</Link>
          </DropdownMenu.Item>
          {account?.isAdmin && <DropdownMenu.Item asChild onSelect={() => setMobileMenuOpen(false)}>
            <Link className={itemClass} href="/admin"><Shield size={16} />{nav.admin}</Link>
          </DropdownMenu.Item>}
          <DropdownMenu.Item className={itemClass} onSelect={() => { setMobileMenuOpen(false); void logout() }}>
            <LogOut size={16} />{nav.signOut}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )

  const links = [
    { href: "/directory", label: nav.directory },
    { href: "/protocols", label: nav.protocols },
    { href: "/#how-it-works", label: nav.howItWorks },
    { href: "/guides", label: nav.guides },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-2 group">
          <LibertureLogo size={36} className="transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold text-white tracking-tight">{brand.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {/* Pillars Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setPillarsDropdownOpen(true)}
            onMouseLeave={() => setPillarsDropdownOpen(false)}
          >
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {nav.pillars}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${pillarsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {pillarsDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72">
                <div className="lb-dropdown overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2">
                  {pillars.map((pillar) => {
                    const Icon = PILLAR_ICON_MAP[pillar.id as keyof typeof PILLAR_ICON_MAP]
                    const styles = PILLAR_STYLES[pillar.id as keyof typeof PILLAR_STYLES]
                    return (
                      <Link
                        key={pillar.id}
                        href={`/pillars/${pillar.id}`}
                        className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                        onClick={() => setPillarsDropdownOpen(false)}
                      >
                        <div className="mt-0.5">
                          {Icon && <Icon className={`h-5 w-5 ${styles?.text || 'text-primary/70'} transition-colors`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium mb-0.5 group-hover:text-foreground transition-colors">
                            {pillar.name}
                          </div>
                          <div className="text-xs text-muted-foreground/80 line-clamp-1">
                            {pillar.description}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Auth Button / User Menu */}
          {isSignedIn ? (
            accountMenu
          ) : (
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => openSignIn()}>
              {nav.signIn}
            </Button>
          )}
          <LanguageSwitch locale={locale} label={t.habits.site.language} />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-auto"
          aria-label={nav.toggleMenu}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl absolute top-16 left-0 right-0 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-col gap-2">
              {/* Pillars Section */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-muted-foreground px-4 py-2">{nav.pillars}</div>
                {pillars.map((pillar) => {
                  const Icon = PILLAR_ICON_MAP[pillar.id]
                  const styles = PILLAR_STYLES[pillar.id as keyof typeof PILLAR_STYLES]
                  return (
                    <Link
                      key={pillar.id}
                      href={`/pillars/${pillar.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Icon className={`h-5 w-5 ${styles?.text || 'text-muted-foreground'}`} />
                      <div>
                        <div className="text-sm font-medium">{pillar.name}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="border-t border-border/50 my-2" />

              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 grid grid-cols-[1fr_auto] items-start gap-2 border-t border-border/50 pt-2">
                <div>
                  {isSignedIn ? (
                    accountMenu
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        openSignIn()
                      }}
                    >
                      {nav.signIn}
                    </Button>
                  )}
                </div>
                <LanguageSwitch locale={locale} label={t.habits.site.language} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
