"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, ChevronDown, User, Shield } from "lucide-react"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { useHabitsSession } from "@/components/habits/session-provider"
import { LanguageSwitch } from "@/components/habits/site/language-switch"
import { LibertureLogo } from "@/components/branding"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"

/** Admin status comes from the server, which holds the admin key list. */
function useIsAdmin(signedIn: boolean) {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    if (!signedIn) {
      setIsAdmin(false)
      return
    }
    let cancelled = false
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setIsAdmin(Boolean(d?.user?.isAdmin)))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [signedIn])
  return isAdmin
}

export function LandingNav() {
  const locale = useLocale()
  const t = useTranslations()
  const { brand } = t
  const { pillars } = t.common
  const nav = t.habits.site.nav
  const { isSignedIn, openSignIn, logout } = useHabitsSession()
  const isAdmin = useIsAdmin(isSignedIn)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pillarsDropdownOpen, setPillarsDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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
                <div className="bg-background border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

          <LanguageSwitch locale={locale} label={t.habits.site.language} />

          {/* Auth Button / User Menu */}
          {isSignedIn ? (
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <Link href="/tracker">
                <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                  <User className="h-4 w-4" />
                  {nav.tracker}
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
              </Link>

              {userMenuOpen && (
                <div className="absolute top-full right-0 pt-2 w-48">
                  <div className="bg-background border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      <Link
                        href="/tracker"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        {nav.tracker}
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-violet-400 hover:bg-violet-500/10 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          {nav.admin}
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout()
                          setUserMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        {nav.signOut}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => openSignIn()}>
              {nav.signIn}
            </Button>
          )}
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

              <div className="px-4 py-2">
                <LanguageSwitch locale={locale} label={t.habits.site.language} />
              </div>

              <div className="border-t border-border/50 mt-2 pt-2">
                {isSignedIn ? (
                  <>
                    <Link href="/tracker" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <User className="h-4 w-4" />
                        {nav.tracker}
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-violet-400">
                          <Shield className="h-4 w-4" />
                          {nav.admin}
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="gap-2 w-full justify-start text-red-500 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      {nav.signOut}
                    </Button>
                  </>
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
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
