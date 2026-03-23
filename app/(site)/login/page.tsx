"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ExternalLink, AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { loginWithNostr } = useAuth()

  const [hasExtension, setHasExtension] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Check for NIP-07 extension
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasExtension(!!window.nostr)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      await loginWithNostr()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-cyan-400 to-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Liberture</CardTitle>
          <CardDescription className="text-base">
            Sign in with your Nostr identity
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground mb-4">
            Use a browser extension like Alby or nos2x
          </div>

          {hasExtension === false && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500 mb-2">
                    No extension detected
                  </p>
                  <p className="text-muted-foreground mb-3">
                    Install a NIP-07 extension:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://getalby.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Alby
                    </a>
                    <a
                      href="https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgrejdlnabb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> nos2x
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleLogin}
            className="w-full gap-2 h-12 text-base"
            size="lg"
            disabled={loading || hasExtension === false}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            {loading ? "Connecting..." : "Sign in with Nostr"}
          </Button>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Why Nostr-only?{" "}
              <a
                href="/about"
                className="text-primary hover:underline"
              >
                Learn why we believe in self-sovereign identity
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
