"use client"

import { TEST_MINT } from "@/lib/challenges/mints"
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
  const { run, busy, error } = useAction()
  const router = useRouter()
  useEffect(() => {
    if (isChecking) return
    let current = true
    const token = location.hash.slice(1)
    request<{ invite: InvitePreview }>("/invite", "POST", { token })
      .then(({ invite }) => {
        if (current) setPreview(invite)
      })
      .catch(() => {
        if (current) setFailed(true)
      })
    return () => {
      current = false
    }
  }, [isChecking, request])
  return (
    <main className="mx-auto max-w-lg space-y-4 p-5 sm:pt-12">
      <h1 className="text-2xl font-semibold">{t("invitation")}</h1>
      {!preview ? (
        <p>{t(failed ? "missing" : "loading")}</p>
      ) : (
        <form
          className={panel}
          onSubmit={(e) => {
            e.preventDefault()
            const name = String(new FormData(e.currentTarget).get("name"))
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
              router.replace("/challenges/" + challenge.id)
            })
          }}
        >
          <h2 className="text-xl font-semibold">{preview.title}</h2>
          <p>{t("invitedBy", { name: preview.creator, role: t(preview.role) })}</p>
          <p className="whitespace-pre-wrap">{preview.rules}</p>
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
              <Field
                label={t("name")}
                name="name"
                defaultValue={profile?.name ?? ""}
                required
                maxLength={48}
              />
              <Button disabled={busy}>{t("accept")}</Button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </main>
  )
}
