"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Flag } from "lucide-react"
import { RaceRunner } from "./cashew-match"
import type { RaceProgress } from "@/lib/challenges/types"

export function SpectatorRefresh() {
  const router = useRouter()
  useEffect(() => {
    const refresh = () => { if (!document.hidden) router.refresh() }
    const timer = window.setInterval(refresh, 15000)
    window.addEventListener("focus", refresh)
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh) }
  }, [router])
  return null
}

export function ChallengeRace({ names, days, progress }: { names: Record<"creator" | "player", string>; days: number; progress: RaceProgress }) {
  const t = useTranslations("challenges")
  return <section className="space-y-3 rounded-xl bg-muted/50 p-4" aria-label={t("race")}>
    <h2 className="flex items-center gap-2 text-sm font-semibold"><Flag className="size-4" />{t("race")}</h2>
    {(["creator","player"] as const).map(side => <div key={side}>
      <div className="flex items-baseline justify-between gap-3 text-sm"><strong>{names[side]}</strong><span>{t("raceDays",{count:progress[side],total:days})}</span></div>
      <div className="relative mx-5 h-11 border-b border-dashed border-muted-foreground/50" role="progressbar" aria-label={names[side]} aria-valuenow={progress[side]} aria-valuemin={0} aria-valuemax={days}>
        <Flag aria-hidden className="absolute bottom-0 right-0 size-4 opacity-50" />
        <span className="absolute bottom-0 -translate-x-1/2 motion-safe:transition-[left] motion-safe:duration-700" style={{left:`${100*progress[side]/days}%`}}><RaceRunner side={side}/></span>
      </div>
    </div>)}
  </section>
}
