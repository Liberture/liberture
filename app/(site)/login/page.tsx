"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ExternalLink, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { loginWithNostr } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasExtension, setHasExtension] = useState<boolean | null>(null)

  useEffect(() => {
    // NIP-07 extensions inject window.nostr asynchronously
    const timer = setTimeout(() => {
      setHasExtension(!!window.nostr)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleNostrLogin = async () => {
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Welcome to Liberture</CardTitle>
          <CardDescription>Sign in with your Nostr identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasExtension === false && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500 mb-2">
                    Nostr extension not detected
                  </p>
                  <p className="text-muted-foreground mb-3">
                    You need a NIP-07 browser extension to sign in. Install one of these:
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://getalby.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Alby (recommended)
                    </a>
                    <a
                      href="https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgrejdlnabb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> nos2x
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleNostrLogin}
            className="w-full gap-2"
            size="lg"
            disabled={loading || hasExtension === false}
          >
            <Zap className="h-4 w-4" />
            {loading ? "Connecting..." : "Sign in with Nostr"}
          </Button>

          {error && (
            <div className="text-sm text-red-500 text-center">{error}</div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Why no email login?{" "}
            <a
              href="https://medium.com/@liberture/why-we-dont-use-email-auth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn more
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
