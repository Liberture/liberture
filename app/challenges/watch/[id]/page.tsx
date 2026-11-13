import { CashewMatch } from "@/components/habits/challenges/cashew-match"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { publicMatch } from "@/lib/challenges/server"
import { TEST_MINT } from "@/lib/challenges/mints"
import { MatchHeading } from "@/components/habits/challenges/match-heading"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const }

export default async function WatchChallenge({ params }: { params: Promise<{ id: string }> }) {
  const match = await publicMatch((await params).id)
  if (!match) notFound()
  const t = await getTranslations("challenges")
  return <main className="lb-wash min-h-screen px-4 py-12">
    <article className="mx-auto max-w-lg space-y-5 rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-medium text-primary">{match.title}</p>
      <h1 className="text-2xl"><MatchHeading creator={match.creator} player={match.player} joined={!!match.player} stage={match.stage} /></h1>
      <CashewMatch stage={match.stage} result={match.result} joined={!!match.player} />
      <p>{t(match.mint === TEST_MINT ? "satsEach" : "liveSats", {amount: match.stake})} · {t("duration",{days: match.durationDays})}</p>
      <section><h2 className="font-semibold">{t("agreedRules")}</h2><p className="whitespace-pre-wrap">{match.rules}</p></section>
      {match.result && <p>{t("outcome",{result: match.result === "draw" ? t("draw") : t("wins",{name:match.result === "creator" ? match.creator : match.player!})})}</p>}
    </article>
  </main>
}
