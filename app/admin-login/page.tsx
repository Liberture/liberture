"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ExternalLink, AlertCircle } from "lucide-react";
import "@/types/nostr";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nostrLoading, setNostrLoading] = useState(false);
  const [hasExtension, setHasExtension] = useState<boolean | null>(null);

  useEffect(() => {
    // NIP-07 extensions inject window.nostr asynchronously
    const timer = setTimeout(() => {
      setHasExtension(!!window.nostr);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNostrLogin = async () => {
    if (!window.nostr) {
      setError("No Nostr extension detected. Please install Alby or nos2x.");
      return;
    }

    setError("");
    setNostrLoading(true);

    try {
      // Step 1: Get challenge from server
      const challengeRes = await fetch("/api/auth/nostr");
      if (!challengeRes.ok) throw new Error("Failed to get challenge");
      const { challenge } = await challengeRes.json();

      // Step 2: Get public key from extension
      const pubkey = await window.nostr.getPublicKey();

      // Step 3: Sign challenge event (NIP-42 kind 22242)
      const unsignedEvent = {
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: challenge,
      };

      const signedEvent = await window.nostr.signEvent(unsignedEvent);

      // Step 4: Send signed event to server for verification
      const authRes = await fetch("/api/auth/nostr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedEvent }),
      });

      if (!authRes.ok) {
        const data = await authRes.json();
        throw new Error(data.error || "Nostr login failed");
      }

      // Successfully logged in — redirect to admin
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nostr login failed");
    } finally {
      setNostrLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        // Successfully logged in, redirect
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-400 flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <CardTitle className="text-2xl text-white">Liberture Admin</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Nostr Login Section */}
          <div className="space-y-4">
            {hasExtension === false && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500 mb-2">
                      Nostr extension not detected
                    </p>
                    <p className="text-slate-400 mb-3">
                      Install a NIP-07 extension to sign in with Nostr:
                    </p>
                    <div className="space-y-2">
                      <a
                        href="https://getalby.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-400 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Alby (recommended)
                      </a>
                      <a
                        href="https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgrejdlnabb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-400 hover:underline"
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
              className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
              size="lg"
              disabled={nostrLoading || hasExtension === false}
            >
              <Zap className="h-4 w-4" />
              {nostrLoading ? "Connecting..." : "Sign in with Nostr"}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="leon@liberture.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
                required
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              variant="outline"
              className="w-full border-slate-600 text-white hover:bg-slate-800"
            >
              {loading ? "Signing in..." : "Sign In with Email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
