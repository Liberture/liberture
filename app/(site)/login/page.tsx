"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, ExternalLink, AlertCircle, Smartphone, Key, Link2, Copy, Check, Loader2, QrCode } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamic import for QR code to avoid SSR issues
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-lg" /> }
)

// Hex conversion utility
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

type ConnectionMethod = "extension" | "connect" | "bunker"

export default function LoginPage() {
  const { loginWithNostr, loginWithNip46 } = useAuth()
  
  // Extension state
  const [hasExtension, setHasExtension] = useState<boolean | null>(null)
  
  // General state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<ConnectionMethod>("extension")
  
  // NostrConnect state
  const [connectUrl, setConnectUrl] = useState("")
  const [connectSession, setConnectSession] = useState<{
    clientSecretKey: Uint8Array
    clientPubkey: string
  } | null>(null)
  const [waitingForConnect, setWaitingForConnect] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Bunker state
  const [bunkerUrl, setBunkerUrl] = useState("")
  const [bunkerValid, setBunkerValid] = useState<boolean | null>(null)
  
  // NIP-46 module loaded state
  const [nip46Module, setNip46Module] = useState<typeof import("@/lib/nip46") | null>(null)

  // Check for NIP-07 extension
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasExtension(!!window.nostr)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Lazy load NIP-46 module
  useEffect(() => {
    import("@/lib/nip46").then(setNip46Module).catch(console.error)
  }, [])

  // Generate nostrconnect URL when tab becomes active
  useEffect(() => {
    if (activeTab === "connect" && !connectUrl && nip46Module) {
      const session = nip46Module.createNostrConnectSession(nip46Module.DEFAULT_NIP46_RELAY)
      setConnectSession(session)
      setConnectUrl(session.connectUrl)
    }
  }, [activeTab, connectUrl, nip46Module])

  // Validate bunker URL
  useEffect(() => {
    if (!bunkerUrl || !nip46Module) {
      setBunkerValid(null)
      return
    }
    setBunkerValid(!!nip46Module.parseBunkerUrl(bunkerUrl))
  }, [bunkerUrl, nip46Module])

  // Handle NIP-07 login
  const handleExtensionLogin = async () => {
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

  // Handle nostrconnect:// flow
  const handleNostrConnect = useCallback(async () => {
    if (!connectSession || !nip46Module) return
    
    setError("")
    setWaitingForConnect(true)
    
    try {
      const client = await nip46Module.waitForNostrConnect(
        connectSession.clientSecretKey,
        connectSession.clientPubkey,
        nip46Module.DEFAULT_NIP46_RELAY,
        120000
      )
      
      // Store connection for session
      nip46Module.storeBunkerConnection({
        pubkey: await client.getPublicKey(),
        relayUrl: nip46Module.DEFAULT_NIP46_RELAY,
        clientPubkey: connectSession.clientPubkey,
        clientSecretKeyHex: bytesToHex(connectSession.clientSecretKey)
      })
      
      await loginWithNip46(client)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setWaitingForConnect(false)
    }
  }, [connectSession, nip46Module, loginWithNip46])

  // Start listening when QR is shown
  useEffect(() => {
    if (activeTab === "connect" && connectSession && !waitingForConnect && nip46Module) {
      handleNostrConnect()
    }
  }, [activeTab, connectSession, waitingForConnect, nip46Module, handleNostrConnect])

  // Handle bunker:// login
  const handleBunkerLogin = async () => {
    if (!bunkerValid || !nip46Module) return
    
    setError("")
    setLoading(true)
    
    try {
      const client = await nip46Module.createBunkerClient(bunkerUrl)
      
      const parsed = nip46Module.parseBunkerUrl(bunkerUrl)!
      nip46Module.storeBunkerConnection({
        pubkey: parsed.pubkey,
        relayUrl: parsed.relayUrl,
        secret: parsed.secret,
        clientPubkey: await client.getPublicKey(),
        clientSecretKeyHex: bytesToHex(new Uint8Array(32))
      })
      
      await loginWithNip46(client)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
    } finally {
      setLoading(false)
    }
  }

  // Copy connect URL
  const copyConnectUrl = async () => {
    await navigator.clipboard.writeText(connectUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Regenerate connect URL
  const regenerateConnectUrl = () => {
    if (!nip46Module) return
    const session = nip46Module.createNostrConnectSession(nip46Module.DEFAULT_NIP46_RELAY)
    setConnectSession(session)
    setConnectUrl(session.connectUrl)
    setWaitingForConnect(false)
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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ConnectionMethod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="extension" className="gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Extension</span>
              </TabsTrigger>
              <TabsTrigger value="connect" className="gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Mobile</span>
              </TabsTrigger>
              <TabsTrigger value="bunker" className="gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Bunker</span>
              </TabsTrigger>
            </TabsList>

            {/* NIP-07 Extension */}
            <TabsContent value="extension" className="space-y-4 mt-6">
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
                        <a
                          href="https://github.com/nicehash/nostr-keyring-extension"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Keyring
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleExtensionLogin}
                className="w-full gap-2 h-12 text-base"
                size="lg"
                disabled={loading || hasExtension === false}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                {loading ? "Connecting..." : "Sign in with Extension"}
              </Button>
            </TabsContent>

            {/* NostrConnect (QR Code) */}
            <TabsContent value="connect" className="space-y-4 mt-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Scan with Amber, Nostrudel, or any NIP-46 signer
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="relative p-4 bg-white rounded-2xl shadow-lg">
                  {connectUrl ? (
                    <QRCodeSVG
                      value={connectUrl}
                      size={200}
                      level="M"
                      bgColor="white"
                      fgColor="black"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  
                  {waitingForConnect && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium text-gray-700">Waiting...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 w-full max-w-[240px]">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={copyConnectUrl}
                    disabled={!connectUrl}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={regenerateConnectUrl}
                    disabled={!nip46Module}
                  >
                    <QrCode className="h-4 w-4" /> New QR
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground max-w-[280px]">
                  Your mobile signer will ask to approve the connection. 
                  The session stays active until you log out.
                </p>
              </div>
            </TabsContent>

            {/* Bunker URL */}
            <TabsContent value="bunker" className="space-y-4 mt-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Paste your bunker connection string
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="bunker-url" className="text-sm font-medium">
                    Bunker URL
                  </Label>
                  <Input
                    id="bunker-url"
                    type="text"
                    placeholder="bunker://pubkey?relay=wss://..."
                    value={bunkerUrl}
                    onChange={(e) => setBunkerUrl(e.target.value)}
                    className={`h-12 font-mono text-sm ${
                      bunkerValid === false ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                  />
                  {bunkerValid === false && (
                    <p className="text-xs text-red-500">
                      Invalid bunker URL format
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleBunkerLogin}
                  className="w-full gap-2 h-12 text-base"
                  size="lg"
                  disabled={loading || !bunkerValid}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Link2 className="h-5 w-5" />
                  )}
                  {loading ? "Connecting..." : "Connect with Bunker"}
                </Button>

                <div className="pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Get a bunker URL from:
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <a
                      href="https://nsec.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> nsec.app
                    </a>
                    <a
                      href="https://github.com/nicehash/nostr-keyring-extension"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Nostr Keyring
                    </a>
                    <a
                      href="https://github.com/greenart7c3/Amber"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Amber
                    </a>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
