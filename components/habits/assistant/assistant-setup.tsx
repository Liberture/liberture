"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Check, CheckCircle2, Copy } from "lucide-react"
import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { Button } from "@/components/habits/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"

export type AssistantPlatform = "claude" | "chatgpt"

interface AssistantSetupProps {
  platform: AssistantPlatform
  onSelect: (platform: AssistantPlatform) => void
  connected: AssistantPlatform[]
  chatgptAlternative?: ReactNode
}

export function AssistantSetup({ platform, onSelect, connected, chatgptAlternative }: AssistantSetupProps) {
  const t = useTranslations().habits.app.onboardingConnectAssistant
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)

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
    <div className="space-y-4">
      <div role="group" aria-label={t.platformLabel} className="mx-auto flex w-fit gap-1 rounded-xl border border-border bg-background/60 p-1">
        {assistants.map(({ kind, name, Logo }) => (
          <Button key={kind} type="button" size="sm" variant={platform === kind ? "secondary" : "ghost"}
            aria-pressed={platform === kind} onClick={() => onSelect(kind)} className="gap-2">
            <Logo className="h-4 w-4" /> {name}
            {connected.includes(kind) && <CheckCircle2 aria-label={t.connected} className="h-4 w-4 text-success" />}
          </Button>
        ))}
      </div>

      {platform === "chatgpt" && chatgptAlternative ? chatgptAlternative : (
        <>
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
        </>
      )}
    </div>
  )
}
