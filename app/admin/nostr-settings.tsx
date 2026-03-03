"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Link2, Eye, EyeOff, Save, Loader2, Users, Key } from "lucide-react";

type NostrAccountData = {
  id?: string;
  npub: string;
  pubkeyHex: string;
  role: string;
  nbunkerUrl: string | null;
  hasSecret: boolean;
};

export default function NostrSettings() {
  const [accountData, setAccountData] = useState<NostrAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [npub, setNpub] = useState("");
  const [nbunkerUrl, setNbunkerUrl] = useState("");
  const [nbunkerSecret, setNbunkerSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAccountData = async () => {
    try {
      const res = await fetch("/api/admin/nostr-account");
      const data = await res.json();
      if (data.account) {
        setAccountData(data.account);
        setNpub(data.account.npub || "");
        setNbunkerUrl(data.account.nbunkerUrl || "");
      } else {
        setAccountData(null);
      }
    } catch (error) {
      console.error("Failed to load nostr account:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  const handleSave = async () => {
    // Either npub or bunker URL is required
    if (!npub.trim() && !nbunkerUrl.trim()) {
      setMessage({ type: "error", text: "Either npub or bunker URL is required" });
      return;
    }

    if (npub.trim() && !npub.startsWith("npub1")) {
      setMessage({ type: "error", text: "Invalid npub format — must start with npub1" });
      return;
    }
    
    if (nbunkerUrl.trim() && !nbunkerUrl.startsWith("bunker://")) {
      setMessage({ type: "error", text: "Invalid bunker URL — must start with bunker://" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/nostr-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npub: npub.trim(),
          nbunkerUrl: nbunkerUrl || null,
          nbunkerSecret: nbunkerSecret || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
        setAccountData(data.account);
        setNbunkerSecret(""); // Clear secret field after save
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const isConnected = accountData?.nbunkerUrl && accountData.nbunkerUrl.length > 0;
  const isConfigured = accountData?.npub && accountData.npub.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liberture Account Card */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Liberture Nostr Account</CardTitle>
                <CardDescription className="text-slate-400">
                  Official account for publishing and signing events
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={isConfigured
                ? isConnected
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                : "bg-slate-500/20 border-slate-500 text-slate-400"
              }
            >
              {isConfigured ? (isConnected ? "Connected" : "Not connected") : "Not configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* npub input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Public Key (npub){" "}
              <span className="text-slate-500 font-normal">— auto-filled from bunker URL</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="npub1... (optional if bunker URL provided)"
                value={npub}
                onChange={(e) => setNpub(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700 text-slate-300 font-mono text-sm"
              />
            </div>
            {accountData?.npub && (
              <p className="text-xs text-slate-500">
                View on{" "}
                <a
                  href={`https://njump.me/${accountData.npub}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  njump.me
                </a>
              </p>
            )}
          </div>

          {/* NBunker URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">NBunker URL (NIP-46)</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="bunker://... or wss://..."
                value={nbunkerUrl}
                onChange={(e) => setNbunkerUrl(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-700"
              />
            </div>
            <p className="text-xs text-slate-500">
              Connect to a remote signer (Nsec.app, Amber, etc.) for secure key management
            </p>
          </div>

          {/* NBunker Secret */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              NBunker Secret{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                placeholder={accountData?.hasSecret ? "••••••••••••" : "Enter secret if required"}
                value={nbunkerSecret}
                onChange={(e) => setNbunkerSecret(e.target.value)}
                className="pr-10 bg-slate-900/50 border-slate-700"
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
            {accountData?.hasSecret && (
              <p className="text-xs text-slate-500">
                Secret is already saved. Enter a new value to update it.
              </p>
            )}
          </div>

          {/* Follows Count Placeholder */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-700">
            <Users className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-300">Following count</p>
              <p className="text-xs text-slate-500">Coming soon — will fetch from relays</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {message.text}
              </p>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
