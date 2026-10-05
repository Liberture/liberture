"use client"

import { AlertTriangle, ShieldAlert } from "lucide-react"
import { Card } from "@/components/habits/ui/card"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface HardModeWarningProps {
  missedCritical: string[]
}

export function HardModeWarning({ missedCritical }: HardModeWarningProps) {
  const t = useTranslations().habits.app.hardModeWarning
  if (missedCritical.length === 0) return null

  return (
    <Card className="border-destructive/30 bg-destructive/10 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="bg-destructive p-2 rounded-lg">
          <ShieldAlert className="h-6 w-6 text-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
            {t.title}
            <AlertTriangle className="h-5 w-5" />
          </h3>
          <p className="text-sm text-destructive font-medium mt-1">
            {formatMessage(t.body, { habits: missedCritical.join(",") })}
          </p>
          <p className="text-xs text-destructive mt-2 uppercase tracking-tighter font-black">
            {t.footer}
          </p>
        </div>
      </div>
    </Card>
  )
}
