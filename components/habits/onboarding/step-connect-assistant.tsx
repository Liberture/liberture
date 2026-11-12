"use client"

import { useEffect, useState } from "react"
import { Check, CheckCircle2, Copy, Loader2 } from "lucide-react"

import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { Button } from "@/components/habits/ui/button"
import { AssistantStartButtons } from "@/components/habits/assistant/assistant-start"
import { assistantKind, useAssistantConnections } from "@/components/habits/assistant/use-assistant-connections"
import { formatMessage } from "@/lib/i18n-format"
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
  const [platform, setPlatform] = useState<"claude" | "chatgpt">("claude")
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)
  const connections = useAssistantConnections(apiKey, true)
  const connected = (connections ?? []).map((c) => assistantKind(c.name)).filter((k): k is "chatgpt" | "claude" => k !== null)
  const anyConnected = (connections ?? []).length > 0

  useEffect(() => setOrigin(window.location.origin), [])
  const mcpUrl = `${origin}/mcp`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const assistants = [
    {
      kind: "claude" as const,
      name: "Claude",
      Logo: ClaudeLogo,
      steps: t.claudeSteps,
    },
    {
      kind: "chatgpt" as const,
      name: "ChatGPT",
      Logo: ChatGPTLogo,
      steps: t.chatgptSteps,
    },
  ]

  const selected = assistants.find(({ kind }) => kind === platform)!

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="mt-2 text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <div role="group" aria-label={t.platformLabel} className="mx-auto flex w-fit gap-1 rounded-xl border border-border bg-background/60 p-1">
        {assistants.map(({ kind, name, Logo }) => (
          <Button key={kind} type="button" size="sm" variant={platform === kind ? "secondary" : "ghost"}
            aria-pressed={platform === kind} onClick={() => setPlatform(kind)} className="gap-2">
            <Logo className="h-4 w-4" /> {name}
            {connected.includes(kind) && <CheckCircle2 aria-label={t.connected} className="h-4 w-4 text-success" />}
          </Button>
        ))}
      </div>

      <div className="mx-auto flex w-fit max-w-full items-center rounded-lg border border-border bg-background pl-3 pr-1">
        <input readOnly value={mcpUrl} size={mcpUrl.length} aria-label={t.urlLabel}
          className="min-w-0 bg-transparent py-2 font-mono text-sm text-foreground" />
        <Button type="button" size="icon" variant="ghost" onClick={copy}
          aria-label={copied ? t.copied : t.copy} title={copied ? t.copied : t.copy} className="shrink-0">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <ol className="mx-auto max-w-md space-y-2 rounded-xl border border-border bg-background/60 p-4">
        {selected.steps.map((step, i) => (
          <li key={step} className="flex gap-2 text-sm text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs text-primary">{i + 1}</span>
            {step}
          </li>
        ))}
      </ol>

      {anyConnected ? (
        // Connected: the assistant takes over setup. Its first chat runs the
        // welcome (get_today asks it to); the wizard stays available here.
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="font-semibold text-foreground">{t.connectedTitle}</p>
          <p className="text-sm text-muted-foreground">{t.connectedBody}</p>
          <AssistantStartButtons connected={connected} className="justify-center" />
          <button type="button" onClick={onNext} className="text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground">
            {t.continueHere}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {formatMessage(t.waiting, { platform: selected.name })}
          </p>
          <Button type="button" onClick={onNext} className="w-full sm:w-auto sm:min-w-48">
            {t.skipForNow}
          </Button>
          <p className="text-xs text-muted-foreground">{t.connectLater}</p>
        </div>
      )}
    </div>
  )
}
