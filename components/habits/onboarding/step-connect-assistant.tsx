"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, CheckCircle2, Copy, Loader2 } from "lucide-react"

import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { Button } from "@/components/habits/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"

interface StepConnectAssistantProps {
  apiKey: string
  isNostrAuth: boolean
  onNext: () => void
}

/**
 * Onboarding step 1: connect Claude or ChatGPT. The assistant is how people
 * use this app, so it comes before building the first habit. Polls the
 * connections list, so approving in the other tab flips this to "Connected".
 */
export function StepConnectAssistant({ apiKey, isNostrAuth, onNext }: StepConnectAssistantProps) {
  const t = useTranslations().habits.app.onboardingConnectAssistant
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState<string[]>([])

  useEffect(() => setOrigin(window.location.origin), [])
  const mcpUrl = `${origin}/mcp`

  const check = useCallback(async () => {
    try {
      const session = isNostrAuth ? localStorage.getItem("habit-tracker-nostr-session") : null
      const url = session ? `/api/v1/connections?token=${encodeURIComponent(session)}` : "/api/v1/connections"
      const res = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined, credentials: "same-origin" })
      if (!res.ok) return
      const data = (await res.json()) as { connections?: { name: string }[] }
      setConnected([...new Set((data.connections ?? []).map((c) => c.name))])
    } catch {
      // Offline or signed out: keep showing the steps.
    }
  }, [apiKey, isNostrAuth])

  useEffect(() => {
    check()
    const timer = window.setInterval(check, 4000)
    window.addEventListener("focus", check)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", check)
    }
  }, [check])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const assistants = [
    {
      name: "Claude",
      Logo: ClaudeLogo,
      steps: t.claudeSteps,
    },
    {
      name: "ChatGPT",
      Logo: ChatGPTLogo,
      steps: t.chatgptSteps,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="mt-2 text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground">
          {mcpUrl}
        </code>
        <Button type="button" variant="secondary" onClick={copy} className="shrink-0 gap-2 border border-border">
          {copied ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
          {copied ? t.copied : t.copy}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {assistants.map(({ name, Logo, steps }) => {
          const isConnected = connected.includes(name)
          return (
            <div key={name} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
                    <Logo className="h-5 w-5 text-foreground" />
                  </span>
                  <span className="font-semibold text-foreground">{name}</span>
                </div>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t.connected}
                  </span>
                ) : null}
              </div>
              <ol className="mt-3 space-y-2">
                {steps.map((step, i) => (
                  <li key={step} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">{i + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        {connected.length === 0 ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.waiting}
          </p>
        ) : null}
        <Button type="button" onClick={onNext} className="w-full sm:w-auto sm:min-w-48">
          {connected.length ? t.continue : t.skipForNow}
        </Button>
        <p className="text-xs text-muted-foreground">{t.connectLater}</p>
      </div>
    </div>
  )
}
