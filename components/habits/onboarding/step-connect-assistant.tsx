"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { AssistantSetup, type AssistantPlatform } from "@/components/habits/assistant/assistant-setup"
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
  const [platform, setPlatform] = useState<AssistantPlatform>("claude")
  const connections = useAssistantConnections(apiKey, true)
  const connected = (connections ?? []).map((c) => assistantKind(c.name)).filter((k): k is "chatgpt" | "claude" => k !== null)
  const anyConnected = (connections ?? []).length > 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="mt-2 text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <AssistantSetup platform={platform} onSelect={setPlatform} connected={connected} />

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
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {formatMessage(t.waiting, { platform: platform === "claude" ? "Claude" : "ChatGPT" })}
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
