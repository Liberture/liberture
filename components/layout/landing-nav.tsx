"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X, ChevronDown } from "lucide-react"
import { translations } from "@/lib/translations"
import { LibertureWordmark } from "@/components/branding"
import { PILLAR_ICON_MAP } from "@/lib/pillars"

export function LandingNav() {
  const { user, logout } = useAuth()
  const { brand, navigation } = translations.en
  const { pillars } = translations.en.common
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pillarsDropdownOpen, setPillarsDropdownOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center group">
          <LibertureWordmark height={32} className="transition-transform group-hover:scale-105" />
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
                    return (
                      <Link
                        key={pillar.id}
                        href={`/pillars/${pillar.id}`}
                        className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-accent/50 transition-all duration-200 group"
                        onClick={() => setPillarsDropdownOpen(false)}
                      >
                        <div className="mt-0.5">
                          {Icon && <Icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />}
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
            href="/knowledge"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Knowledge
          </Link>

          {/* Auth Button */}
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                {navigation.dashboard}
              </Button>
            </Link>
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
                  return (
                    <Link
                      key={pillar.id}
                      href={`/pillars/${pillar.id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
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
                href="/knowledge"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Knowledge
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
