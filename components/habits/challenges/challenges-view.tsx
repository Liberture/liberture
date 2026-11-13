"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useHabitsSession } from "@/components/habits/session-provider"
import type { Challenge } from "@/lib/challenges/types"
import { MAX_STAKE, TEST_MINT } from "@/lib/challenges/mints"
import { InviteTarget } from "./invite-target"
import { ChallengeDetail } from "./detail"
import { Field, panel, rememberWallet, useAction, useChallengeClient } from "./common"

export function ChallengesView() {
  const t = useTranslations("challenges")
  const { request, isChecking } = useChallengeClient()
  const { profile, auth } = useHabitsSession()
  const [registered, setRegistered] = useState(false)
  const [items, setItems] = useState<Challenge[] | null>(null)
  const [selected, setSelected] = useState<Challenge | null>(null)
  const [creating, setCreating] = useState(false)
  const [links, setLinks] = useState<Partial<Record<"player" | "moderator", string>>>({})
  const [listError, setListError] = useState(false)
  const [retry, setRetry] = useState(0)
  const { run, busy, error } = useAction()
  useEffect(() => {
    if (isChecking || selected) return
    let current = true
    setListError(false)
    request<{ challenges: Challenge[] }>("")
      .then((r) => {
        if (current) setItems(r.challenges)
      })
      .catch(() => {
        if (current) setListError(true)
      })
    return () => {
      current = false
    }
  }, [request, isChecking, selected, retry])

  if (selected)
    return (
      <ChallengeDetail
        key={selected.id}
        initial={selected}
        invites={links}
        back={() => {
          setSelected(null)
          setLinks({})
        }}
      />
    )
  return (
    <section className="mx-auto w-full max-w-2xl space-y-4 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Trophy className="size-6 text-primary" />
          {t("title")}
        </h2>
        {!creating && <Button onClick={() => setCreating(true)}>{t("new")}</Button>}
      </header>
      <p className="text-sm text-muted-foreground">{t("liveMint")}</p>
      {auth.pubkey && !creating && <details className={panel}>
        <summary>{t("registerModerator")}</summary><p>{t("registerExplanation")}</p>
        <Button disabled={busy || registered} onClick={()=>void run(async()=>{
          const {challengePublicKey}=await import("@/lib/challenges/cashu")
          const owner="moderator-"+auth.pubkey
          const pubkey=challengePublicKey(owner)
          rememberWallet(pubkey,owner)
          await request("/moderator","POST",{pubkey,name:(profile?.name || auth.pubkey!.slice(0,12)).slice(0,48)})
          setRegistered(true)
        })}>{t(registered?"registered":"registerModerator")}</Button>
        {error && <p role="alert">{error}</p>}
      </details>}
      {creating ? (
        <form
          className={panel}
          onSubmit={(event) => {
            event.preventDefault()
            const values = new FormData(event.currentTarget)
            void run(async () => {
              const { challengePublicKey } = await import("@/lib/challenges/cashu")
              const owner = crypto.randomUUID()
              const pubkey = challengePublicKey(owner)
              rememberWallet(pubkey, owner)
              const body = Object.fromEntries(values)
              const response = await request<{
                challenge: Challenge
                invites: Record<"player" | "moderator", string>
              }>("", "POST", {
                ...body,
                pubkey,
                stake: Number(body.stake),
                durationDays: Number(body.durationDays),
                playerNpub: String(body.playerNpub ?? "").trim() || undefined,
                moderatorNpub: String(body.moderatorNpub ?? "").trim() || undefined,
              })
              setLinks(response.invites)
              setCreating(false)
              setSelected(response.challenge)
            })
          }}
        >
          <Field label={t("name")} name="name" defaultValue={profile?.name ?? ""} required maxLength={48} />
          <Field
            label={t("challengeName")}
            name="title"
            placeholder={t("example")}
            required
            maxLength={100}
          />
          <label className="grid gap-1.5 text-sm font-medium">
            {t("rules")}
            <Textarea required name="rules" maxLength={1500} placeholder={t("rulesHint")} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t("liveStake")}
              name="stake"
              type="number"
              min={1}
              max={MAX_STAKE}
              defaultValue={10000}
              required
            />
            <Field
              label={t("days")}
              name="durationDays"
              type="number"
              min={1}
              max={90}
              defaultValue={14}
              required
            />
          </div>
          <InviteTarget role="player" />
          <InviteTarget role="moderator" />
          {error && <p role="alert">{error}</p>}
          <div className="flex gap-2">
            <Button disabled={busy}>{t("create")}</Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setCreating(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : listError ? (
        <Button variant="outline" onClick={() => setRetry((r) => r + 1)}>
          {t("retryList")}
        </Button>
      ) : items === null ? (
        <p>{t("loading")}</p>
      ) : items.length ? (
        items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className={panel + " block w-full text-left hover:border-primary"}
          >
            <strong>{item.title}</strong>
            <p className="text-sm text-muted-foreground">
              {t(item.stage)} · {t(item.mint === TEST_MINT ? "satsEach" : "liveSats", { amount: item.stake })}
            </p>
          </button>
        ))
      ) : (
        <div className={panel}>{t("empty")}</div>
      )}
    </section>
  )
}
