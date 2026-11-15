"use client"

import { TEST_MINT } from "@/lib/challenges/mints"
import { LoaderCircle } from "lucide-react"
import { PlayerProfile } from "./player-profile"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useHabitsSession } from "@/components/habits/session-provider"
import type { Challenge, InvitePreview } from "@/lib/challenges/types"
import { Field, initialWallet, panel, rememberWallet, useAction, useChallengeClient } from "./common"

export function ChallengeInvite() {
  const t = useTranslations("challenges")
  const { request, isChecking } = useChallengeClient()
  const { auth, openSignIn, profile } = useHabitsSession()
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const { run, busy, error } = useAction()
  const router = useRouter()
  useEffect(() => {
    if (isChecking) return
    let current = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    setFailed(false)
    const token = location.hash.slice(1)
    request<{ invite: InvitePreview; challenge?: Challenge }>("/invite", "POST", { token }, controller.signal)
      .then(({ invite, challenge }) => {
        if (!current) return
        if (challenge) router.replace("/challenges/" + challenge.id)
        else setPreview(invite)
      })
      .catch(() => { if (current) setFailed(true) })
      .finally(() => clearTimeout(timeout))
    const changed = () => { setPreview(null); setRetry(n => n + 1) }
    window.addEventListener("hashchange", changed)
    return () => {
      current = false
      clearTimeout(timeout)
      controller.abort()
      window.removeEventListener("hashchange", changed)
    }
  }, [isChecking, request, retry, router])
  return (
    <main className="mx-auto max-w-lg space-y-4 p-5 sm:pt-12">
      <h1 className="text-2xl font-semibold">{t("invitation")}</h1>
      {!preview ? (
        <div className={panel} role="status">
          {failed ? <><p>{t("inviteLoadFailed")}</p><Button onClick={() => setRetry(n => n + 1)}>{t("retryInvite")}</Button></> : <p className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" />{t("loading")}</p>}
        </div>
      ) : (
        <form
          className={panel}
          onSubmit={(e) => {
            e.preventDefault()
            const name = auth.pubkey ? (profile?.name || profile?.nip05 || auth.pubkey.slice(0,12)) : String(new FormData(e.currentTarget).get("name"))
            void run(async () => {
              const token = location.hash.slice(1)
              const { challengePublicKey } = await import("@/lib/challenges/cashu")
              const owner = initialWallet("join-" + preview.id + "-" + preview.role)
              const pubkey = challengePublicKey(owner)
              rememberWallet(pubkey, owner)
              const { challenge } = await request<{ challenge: Challenge }>("/invite", "POST", {
                token,
                name,
                pubkey,
              })
              if (preview.role === "player") sessionStorage.setItem("challenge:start-payment:" + challenge.id, JSON.stringify({ key: pubkey, stake: preview.stake }))
              router.replace("/challenges/" + challenge.id + (preview.role === "player" ? "?pay=1" : ""))
            })
          }}
        >
          <h2 className="text-xl font-semibold">{preview.title}</h2>
          <p className="font-medium text-primary">{t("waitingForYou", { name: preview.creator })}</p>
          <p>{t("invitedBy", { name: preview.creator, role: t(preview.role) })}</p>
          <p>
            {t(preview.mint === TEST_MINT ? "satsEach" : "liveSats", { amount: preview.stake })} · {t("duration", { days: preview.durationDays })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(preview.mint === TEST_MINT ? "testMint" : "liveMint")} {t(preview.requiresNostr ? "bound" : "guest")}
          </p>
          {preview.requiresNostr && !auth.pubkey ? (
            <Button type="button" onClick={() => openSignIn({ next: null })}>
              {t("signIn")}
            </Button>
          ) : (
            <>
              {auth.pubkey ? <PlayerProfile name={profile?.name || profile?.nip05 || auth.pubkey.slice(0,12)} picture={profile?.picture} /> : <Field
                label={t("name")}
                name="name"
                defaultValue={profile?.name ?? ""}
                required
                maxLength={48}
              />}
              <Button disabled={busy}>{busy ? <><LoaderCircle className="size-4 animate-spin" />{t("joining")}</> : t(preview.role === "player" ? "joinAndPay" : "accept", {amount:preview.stake})}</Button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <details className="border-t pt-3"><summary className="cursor-pointer font-medium">{t("agreedRules")}</summary><p className="mt-2 whitespace-pre-wrap text-sm">{preview.rules}</p></details>
        </form>
      )}
    </main>
  )
}
