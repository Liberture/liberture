"use client"

import { TEST_MINT } from "@/lib/challenges/mints"
import { QrCode } from "@/components/habits/qr-code"
import { NostrRecipient } from "./invite-target"
import { CashewMatch } from "./cashew-match"
import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { Challenge, ChallengeAction, Player, Result } from "@/lib/challenges/types"
import { inviteLink, panel, rememberWallet, useAction, useChallengeClient } from "./common"

const players = ["creator", "player"] as const
const roles = [...players, "moderator"] as const
type Invites = Partial<Record<"player" | "moderator", string>>

function download(name: string, value: string) {
  const url = URL.createObjectURL(new Blob([value], { type: "text/plain" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function ChallengeRoom({ id }: { id: string }) {
  const t = useTranslations("challenges")
  const { request, isChecking } = useChallengeClient()
  const [challenge, setChallenge] = useState<Challenge>()
  const [error, setError] = useState("")
  useEffect(() => {
    if (isChecking) return
    let mounted = true
    request<{ challenge: Challenge }>("/" + id)
      .then((r) => {
        if (mounted) setChallenge(r.challenge)
      })
      .catch((e) => {
        if (mounted) setError(e.message)
      })
    return () => {
      mounted = false
    }
  }, [id, request, isChecking])
  return (
    <main className="p-4">
      {challenge ? <ChallengeDetail initial={challenge} /> : <p>{error || t("loading")}</p>}
    </main>
  )
}

export function ChallengeDetail({
  initial,
  invites = {},
  back,
}: {
  initial: Challenge
  invites?: Invites
  back?: () => void
}) {
  const t = useTranslations("challenges")
  const { request } = useChallengeClient()
  const locale = useLocale()
  const [c, setChallenge] = useState(initial)
  const [recipientRole, setRecipientRole] = useState<"player" | "moderator" | null>(null)
  const [tokens, setTokens] = useState(invites)
  const [choice, choose] = useState<Result | null>(null)
  const [notice, notify] = useState("")
  const { busy, error, run } = useAction()
  const path = "/" + c.id
  function update(next: Challenge) {
    setChallenge((prev) => (next.revision >= prev.revision ? next : prev))
  }
  useEffect(() => {
    if (c.stage === "settled") return
    let live = true
    async function refresh() {
      if (document.hidden) return
      try {
        const response = await request<{ challenge: Challenge }>(path)
        if (live) update(response.challenge)
      } catch {
        /* Retry on focus or next interval. */
      }
    }
    const timer = setInterval(refresh, 10000)
    window.addEventListener("focus", refresh)
    return () => {
      live = false
      clearInterval(timer)
      window.removeEventListener("focus", refresh)
    }
  }, [request, path, c.stage])
  async function act(command: ChallengeAction) {
    const response = await request<{ challenge: Challenge; token?: string }>(path, "PATCH", command)
    update(response.challenge)
    return response
  }
  const me = c.role
  const myKey = c.members[me]!.pubkey
  function walletId() {
    const id = localStorage.getItem("challenge-wallet-for:" + myKey)
    if (!id) throw new Error(t(c.mint === TEST_MINT ? "keyHint" : "liveKeyHint"))
    return id
  }
  function terms() {
    if (!c.expiresAt || !c.members.player || (!c.members.moderator && c.arbitration !== "none")) throw new Error(t("wait"))
    return {
      mint: c.mint,
      id: c.id,
      stake: c.stake,
      refundAt: c.expiresAt,
      keys: {
        creator: c.members.creator!.pubkey,
        player: c.members.player.pubkey,
        moderator: c.members.moderator?.pubkey,
      },
    }
  }
  const label = (result: Result) =>
    result === "draw" ? t("draw") : t("wins", { name: c.members[result]!.name })
  const button = (text: string, task: () => Promise<unknown>) => (
    <Button
      disabled={busy}
      onClick={() =>
        void run(async () => {
          notify("")
          await task()
        })
      }
    >
      {text}
    </Button>
  )
  const [invoice, setInvoice] = useState("")
  const test = c.mint === TEST_MINT
  const expired = c.stage === "expired"
  const myDeposit = me !== "moderator" && c.deposits[me]
  const myRefund = me !== "moderator" ? c.refunds[me] : undefined
  const moderatorSigned = !!c.settlements.creator?.signatures.moderator
  const signatures = Object.keys(c.settlements.creator?.signatures ?? {}).length
  return (
    <section className="mx-auto w-full max-w-2xl space-y-4 pb-8">
      {back && (
        <Button variant="ghost" onClick={back}>
          {t("back")}
        </Button>
      )}
      <header className={panel}>
        <p className="text-sm font-medium text-primary">
          {t(c.stage)} · {t("yourRole", { role: t(me) })}
        </p>
        <h1 className="text-2xl font-semibold">{c.title}</h1>
        <CashewMatch challenge={c} />
        <p className="whitespace-pre-wrap">{c.rules}</p>
        <p>
          {t(test ? "satsEach" : "liveSats", { amount: c.stake })} · {t("duration", { days: c.durationDays })}
        </p>
        <p className="text-sm text-muted-foreground">{t(test ? "testMint" : "liveMint")}</p>
        {c.expiresAt && <p>{t("deadline", { date: new Date(c.expiresAt * 1000).toLocaleString(locale) })}</p>}
        <ul className="divide-y divide-border">
          {roles.filter(role => role !== "moderator" || c.arbitration !== "none").map((role) => (
            <li key={role} className="flex justify-between gap-3 py-2">
              <span>{t(role)}</span>
              <strong>
                {c.members[role]?.name ?? t("pending")}
                {role !== "moderator" &&
                  c.deposits[role] &&
                  " · " +
                    t(
                      c.refunds[role]?.receipt
                        ? "refunded"
                        : c.settlements[role]?.receipt
                          ? "settled"
                          : "funded",
                    )}
              </strong>
            </li>
          ))}
        </ul>
      </header>
      {me === "creator" &&
        (["player", "moderator"] as const).map(
          (role) =>
            !c.members[role] && (role !== "moderator" || c.arbitration !== "none") && (
              <section key={role} className="rounded-xl border border-border bg-card px-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="mr-auto text-sm font-medium">{t("inviteRole", { role: t(role) })}</h2>
                  <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void run(async () => {
                    if (!tokens[role]) {
                      const r = await act({ action: "invite", role })
                      setTokens(prev => ({ ...prev, [role]: r.token }))
                      notify(t("linkReady"))
                      return
                    }
                    await navigator.clipboard.writeText(inviteLink(tokens[role]!))
                    notify(t("copied"))
                  })}>{t(tokens[role] ? "copyLink" : "rotateLink")}</Button>
                  <Button type="button" size="sm" aria-expanded={recipientRole === role} onClick={() => setRecipientRole(recipientRole === role ? null : role)}>{t("viaNostr")}</Button>
                </div>
                {recipientRole === role && <form className="mt-2 grid gap-2 border-t pt-3" onSubmit={e => {
                  e.preventDefault()
                  const recipient = String(new FormData(e.currentTarget).get("recipient"))
                  void run(async () => {
                    let token = tokens[role]
                    if (!token) {
                      token = (await act({ action: "invite", role })).token
                      setTokens(prev => ({ ...prev, [role]: token }))
                    }
                    if (!token) throw new Error(t("dmError"))
                    const { sendChallengeInvite } = await import("@/lib/challenges/nostr-invite")
                    try {
                      await sendChallengeInvite(recipient, t("dmBody", { name: c.members.creator!.name, title: c.title, url: inviteLink(token) }))
                    } catch (e) {
                      throw new Error(t(e instanceof Error && e.message === "noInbox" ? "noInbox" : "dmError"))
                    }
                    setRecipientRole(null)
                    notify(t("relayed"))
                  })
                }}>
                  <NostrRecipient nameField="recipient" initialNpub={c.invitedNpubs?.[role]} />
                  <Button type="submit" size="sm" disabled={busy} className="justify-self-end">{t("confirmSend")}</Button>
                </form>}
              </section>
            ),
        )}
      {me !== "moderator" &&
        (c.stage === "funding" || expired && (c.members.moderator || c.arbitration === "none") && c.members.player) &&
        !myDeposit &&
        button(t(test ? "fund" : expired ? "recoverDeposit" : "liveFund", { amount: c.stake }), async () => {
          const { fundDeposit } = await import("@/lib/challenges/cashu")
          await act({ action: "fund", token: await fundDeposit(walletId(), terms(), me, setInvoice) })
        })}
      {invoice && !myDeposit && !expired && <section className={panel}>
        <h2>{t("payInvoice")}</h2><QrCode value={invoice.toUpperCase()} title={t("payInvoice")} className="mx-auto size-56" />
        <a className="underline" href={"lightning:"+invoice}>{t("openWallet")}</a>
        <input className="w-full" readOnly aria-label={t("payInvoice")} value={invoice} onFocus={e=>e.target.select()} />
      </section>}
      {((c.stage === "active" && me !== "moderator") || (c.stage === "disputed" && me === "moderator")) && (
        <section className={panel}>
          <h2 className="font-semibold">{t("chooseOutcome")}</h2>
          <div className="flex flex-wrap gap-2">
            {([...players, "draw"] as const).map((r) => (
              <Button
                key={r}
                variant={choice === r ? "default" : "outline"}
                aria-pressed={choice === r}
                onClick={() => choose(r)}
              >
                {label(r)}
              </Button>
            ))}
          </div>
          {choice && button(t("confirmVote"), () => act({ action: "vote", result: choice }))}
          {c.stage === "active" && c.arbitration !== "none" && (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await act({ action: "dispute" })
                })
              }
            >
              {t("askModerator")}
            </Button>
          )}
        </section>
      )}
      {Object.keys(c.votes).length > 0 && (
        <div className={panel}>
          <h2 className="font-semibold">{t("votes")}</h2>
          {roles.map(
            (r) =>
              c.votes[r] && (
                <p key={r}>
                  {c.members[r]?.name} · {label(c.votes[r]!)}
                </p>
              ),
          )}
        </div>
      )}
      {c.result && (
        <section className={panel}>
          <h2 className="font-semibold">{t("outcome", { result: label(c.result) })}</h2>
          {c.stage === "settling" &&
            (!c.settlements.creator ? (
              button(t("prepare"), () => act({ action: "prepare" }))
            ) : (
              <>
                <p>{t("signedCount", { count: signatures })}</p>
                <p>
                  {t(test ? "fees" : "liveFees", {
                    amount: players.reduce((sum, p) => sum + Number(c.settlements[p]?.plan.fees ?? 0), 0),
                  })}
                </p>
                {signatures >= 2 && (!c.disputed || moderatorSigned)
                  ? button(t("settle"), () => act({ action: "settle" }))
                  : !c.settlements.creator.signatures[me] &&
                    (me !== "moderator" || c.disputed) &&
                    button(t("sign"), async () => {
                      const { signPayout } = await import("@/lib/challenges/cashu")
                      const sigs: Partial<Record<Player, string>> = {}
                      for (const p of players)
                        sigs[p] = await signPayout(
                          walletId(),
                          terms(),
                          p,
                          c.deposits[p]!,
                          c.result!,
                          c.settlements[p]!.plan,
                        )
                      await act({ action: "sign", signatures: sigs })
                    })}
              </>
            ))}
        </section>
      )}
      {expired &&
        me !== "moderator" &&
        myDeposit &&
        !myRefund?.receipt &&
        !c.settlements[me]?.receipt &&
        button(t("refund"), async () => {
          const { signPayout } = await import("@/lib/challenges/cashu")
          const leg = myRefund ?? (await act({ action: "prepareRefund" })).challenge.refunds[me]!
          if (!leg.signatures[me])
            await act({
              action: "signRefund",
              signature: await signPayout(walletId(), terms(), me, myDeposit, "draw", leg.plan),
            })
          await act({ action: "refund" })
        })}
      {players.map((p) => {
        const receipt =
          (me === p && c.refunds[p]?.receipt) ||
          ((c.result === me || (c.result === "draw" && p === me)) && c.settlements[p]?.receipt)
        return (
          receipt && (
            <div key={p}>
              {button(t("redeem", { name: c.members[p]!.name }), async () => {
                const { redeemPayout } = await import("@/lib/challenges/cashu")
                download("challenge-" + c.id + "-" + p + ".cashu", await redeemPayout(walletId(), receipt, c.mint))
              })}
            </div>
          )
        )
      })}
      <details className={panel}>
        <summary>{t("backupKey")}</summary>
        <p className="text-sm">{t(c.mint === TEST_MINT ? "keyHint" : "liveKeyHint")}</p>
        <div className="flex flex-wrap gap-2">
          {button(t("backupKey"), async () => {
            const { exportChallengeKey } = await import("@/lib/challenges/cashu")
            download("challenge-" + c.id + "-" + me + ".key", exportChallengeKey(walletId()))
          })}
          {myDeposit &&
            button(t("backupDeposit"), async () =>
              download(
                "challenge-" + c.id + "-deposit.json",
                JSON.stringify({ terms: terms(), mint: c.mint, token: myDeposit }),
              ),
            )}
        </div>
        <label className="grid gap-1">
          {t("restoreKey")}
          <input
            type="file"
            accept=".key,text/plain"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void run(async () => {
                const wallet = await import("@/lib/challenges/cashu")
                const id = crypto.randomUUID()
                wallet.importChallengeKey(id, (await file.text()).trim())
                if (wallet.challengePublicKey(id) !== myKey) throw new Error(t("wrongKey"))
                rememberWallet(myKey, id)
              })
            }}
          />
        </label>
      </details>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
