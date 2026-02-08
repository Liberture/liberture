"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, ShoppingBag, BookOpen, Menu, X } from "lucide-react"
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
          <LibertureLogo size={40} className="transition-transform group-hover:scale-110" />
          <span className="text-xl font-bold tracking-tight">{brand.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {navigation.features}
          </Link>
          <Link href="#pillars" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {navigation.pillars}
          </Link>
          <Link
            href="/marketplace"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ShoppingBag className="h-4 w-4" />
            {navigation.marketplace}
          </Link>
          <Link
            href="/knowledge"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            {navigation.knowledge}
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {navigation.howItWorks}
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {navigation.dashboard}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                {navigation.logout}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {navigation.signIn}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  {navigation.getStarted}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex flex-col gap-2">
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {navigation.features}
              </Link>
              <Link
                href="#pillars"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {navigation.pillars}
              </Link>
              <Link
                href="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                {navigation.marketplace}
              </Link>
              <Link
                href="/knowledge"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {navigation.knowledge}
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {navigation.howItWorks}
              </Link>

              <div className="border-t border-border/50 mt-2 pt-4 flex flex-col gap-2">
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
                      className="gap-2 w-full justify-start"
                    >
                      <LogOut className="h-4 w-4" />
                      {navigation.logout}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        {navigation.signIn}
                      </Button>
                    </Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                        {navigation.getStarted}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
