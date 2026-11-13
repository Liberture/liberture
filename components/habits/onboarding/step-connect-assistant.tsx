"use client"

import { useState } from "react"

import { AssistantSetup, type AssistantPlatform } from "@/components/habits/assistant/assistant-setup"
import { Button } from "@/components/habits/ui/button"
import { AssistantStartButtons } from "@/components/habits/assistant/assistant-start"
import { assistantKind, useAssistantConnections } from "@/components/habits/assistant/use-assistant-connections"
import { useTranslations } from "@/components/i18n/locale-provider"

export function StepConnectAssistant({ onNext }: { onNext: () => void }) {
  const t = useTranslations().habits.app.onboardingConnectAssistant
  const [platform, setPlatform] = useState<AssistantPlatform>("claude")
  const connections = useAssistantConnections(true)
  const connected = (connections ?? []).map((c) => assistantKind(c.name)).filter((k): k is "chatgpt" | "claude" => k !== null)
  const anyConnected = (connections ?? []).length > 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
        <p className="mx-auto mt-2 w-[85%] text-muted-foreground">
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
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-3">
        <div className="onboarding-actions">
          <Button type="button" onClick={onNext}>{anyConnected ? t.continueHere : t.skipForNow}</Button>
        </div>
        {!anyConnected && (
          <p className="text-center text-xs text-muted-foreground">{t.connectLater}</p>
        )}
      </div>
    </div>
  )
}
