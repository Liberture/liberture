"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Check, CheckCircle2, Copy } from "lucide-react"
import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <Tabs value={platform} onValueChange={value => onSelect(value as AssistantPlatform)}
      className="mx-auto w-full max-w-md gap-0 overflow-hidden rounded-xl border border-border bg-background/60">
      <TabsList aria-label={t.platformLabel} className="h-10 w-full rounded-none bg-muted/40 p-0">
        {assistants.map(({ kind, name, Logo }) => (
          <TabsTrigger key={kind} value={kind}
            className="h-full gap-2 rounded-none border-0 border-b-2 border-border text-muted-foreground focus-visible:ring-inset data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent">
            <Logo className="h-4 w-4" /> {name}
            {connected.includes(kind) && <CheckCircle2 aria-label={t.connected} className="h-4 w-4 text-success" />}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={platform} className="space-y-2 p-4 text-left">
        {platform === "chatgpt" && chatgptAlternative ? chatgptAlternative : (
          <ol className="space-y-2">
            {selected.steps.map((step, i) => (
              <li key={step} className="flex gap-2 text-sm text-muted-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs text-primary">{i + 1}</span>
                <div className="min-w-0">
                  {step}
                  {i === 1 && origin && (
                    <button type="button" onClick={copy} aria-label={`${copied ? t.copied : t.copy} · ${t.urlLabel}`}
                      title={copied ? t.copied : t.copy}
                      className="mt-1 flex max-w-full items-center gap-2 rounded py-1 text-left text-foreground hover:text-primary focus-visible:outline-primary">
                      <code className="min-w-0 break-all">{mcpUrl}</code>
                      {copied ? <Check className="h-4 w-4 shrink-0 text-success" /> : <Copy className="h-4 w-4 shrink-0" />}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  )
}
