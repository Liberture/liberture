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
            Email login coming soon. For now, sign in with your Nostr identity.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/* =============================================================================
 * PRESERVED: Original email/password login — re-enable when ready
 * =============================================================================
 *
 * import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
 *
 * // Login form state
 * const [loginEmail, setLoginEmail] = useState("")
 * const [loginPassword, setLoginPassword] = useState("")
 *
 * // Register form state
 * const [registerEmail, setRegisterEmail] = useState("")
 * const [registerPassword, setRegisterPassword] = useState("")
 * const [registerName, setRegisterName] = useState("")
 *
 * const handleLogin = async (e: React.FormEvent) => {
 *   e.preventDefault()
 *   setError("")
 *   setLoading(true)
 *   try {
 *     await login(loginEmail, loginPassword)
 *   } catch (err) {
 *     setError(err instanceof Error ? err.message : "Login failed")
 *   } finally {
 *     setLoading(false)
 *   }
 * }
 *
 * const handleRegister = async (e: React.FormEvent) => {
 *   e.preventDefault()
 *   setError("")
 *   setLoading(true)
 *   try {
 *     await register(registerEmail, registerPassword, registerName)
 *   } catch (err) {
 *     setError(err instanceof Error ? err.message : "Registration failed")
 *   } finally {
 *     setLoading(false)
 *   }
 * }
 *
 * <Tabs defaultValue="login" className="w-full">
 *   <TabsList className="grid w-full grid-cols-2">
 *     <TabsTrigger value="login">Login</TabsTrigger>
 *     <TabsTrigger value="register">Register</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="login">
 *     <form onSubmit={handleLogin} className="space-y-4">
 *       <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
 *       <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
 *       <Button type="submit" className="w-full" disabled={loading}>
 *         {loading ? "Logging in..." : "Login"}
 *       </Button>
 *     </form>
 *   </TabsContent>
 *   <TabsContent value="register">
 *     <form onSubmit={handleRegister} className="space-y-4">
 *       <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required />
 *       <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
 *       <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength={6} />
 *       <Button type="submit" className="w-full" disabled={loading}>
 *         {loading ? "Creating account..." : "Create Account"}
 *       </Button>
 *     </form>
 *   </TabsContent>
 * </Tabs>
 *
 * =============================================================================
 */
