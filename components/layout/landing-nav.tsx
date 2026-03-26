"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, ChevronDown, User, Shield } from "lucide-react"
import { translations } from "@/lib/translations"
import { LibertureLogo } from "@/components/branding"
import { PILLAR_ICON_MAP, PILLAR_STYLES } from "@/lib/pillars"

export function LandingNav() {
  const { user, logout } = useAuth()
  const { brand, navigation } = translations.en
  const { pillars } = translations.en.common
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pillarsDropdownOpen, setPillarsDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-2 group">
          <LibertureLogo size={36} className="transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold text-white tracking-tight">Liberture</span>
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
              Pillars 
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${pillarsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {pillarsDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72">
                <div className="bg-background border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2">
                  {pillars.map((pillar, index) => {
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
          
          <Link
            href="/directory"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Directory
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Marketplace
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it Works
          </Link>

          {/* Auth Button / User Menu */}
          {user ? (
            <div 
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                <User className="h-4 w-4" />
                {navigation.dashboard}
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {userMenuOpen && (
                <div className="absolute top-full right-0 pt-2 w-48">
                  <div className="bg-background border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-violet-400 hover:bg-violet-500/10 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
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
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                {navigation.getStarted}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-auto"
          aria-label="Toggle menu"
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
                <div className="text-xs font-semibold text-muted-foreground px-4 py-2">Pillars</div>
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
              
              <Link
                href="/directory"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Directory
              </Link>
              <Link
                href="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                How it Works
              </Link>

              <div className="border-t border-border/50 mt-2 pt-2">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        {navigation.dashboard}
                      </Button>
                    </Link>
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
                      {navigation.logout}
                    </Button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                      {navigation.getStarted}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
