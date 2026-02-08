"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { translations } from "@/lib/translations"
import { LibertureLogo } from "@/components/branding"

export function LandingNav() {
  const { user, logout } = useAuth()
  const { brand, navigation } = translations.en
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link href="/" className="flex items-center gap-3 group">
          <LibertureLogo size={48} className="transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold tracking-tight">{brand.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <Link
            href="/games"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Games
          </Link>
          <Link
            href="/directory"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Directory
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
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl absolute top-16 left-0 right-0 shadow-lg">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-col gap-2">
              <Link
                href="/games"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Games
              </Link>
              <Link
                href="/directory"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Directory
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
