"use client"

import { useTranslations } from "next-intl"
import type { ChallengeStage } from "@/lib/challenges/types"

export function MatchHeading({ creator, player, joined, stage, status }: {
  creator: string; player?: string; joined: boolean; stage: ChallengeStage; status?: string
}) {
  const t = useTranslations("challenges")
  return <span className="block min-w-0">
    <strong className="block break-words">{creator} <span className="font-normal text-muted-foreground">{t("versus")}</span> {player || t("secondPlayer")}</strong>
    <span className="mt-1 block text-sm font-normal text-muted-foreground">{status || t(joined ? stage : "pendingInvite")}</span>
  </span>
}
