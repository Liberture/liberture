"use client"

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
    if (!id) throw new Error(t("keyHint"))
    return id
  }
  function terms() {
    if (!c.expiresAt || !c.members.player || !c.members.moderator) throw new Error(t("wait"))
    return {
      id: c.id,
      stake: c.stake,
      refundAt: c.expiresAt,
      keys: {
        creator: c.members.creator!.pubkey,
        player: c.members.player.pubkey,
        moderator: c.members.moderator.pubkey,
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
          {t("satsEach", { amount: c.stake })} · {t("duration", { days: c.durationDays })}
        </p>
        <p className="text-sm text-muted-foreground">{t("testMint")}</p>
        {c.expiresAt && <p>{t("deadline", { date: new Date(c.expiresAt * 1000).toLocaleString(locale) })}</p>}
        <ul className="divide-y divide-border">
          {roles.map((role) => (
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
            !c.members[role] && (
              <section key={role} className={panel}>
                <h2 className="font-semibold">{t("inviteRole", { role: t(role) })}</h2>
                {tokens[role] ? (
                  <>
                    <input
                      className="w-full rounded border bg-background p-2"
                      aria-label={t("inviteRole", { role: t(role) })}
                      readOnly
                      value={inviteLink(tokens[role]!)}
                      onFocus={(e) => e.target.select()}
                    />
                    <div className="flex flex-wrap gap-2">
                      {button(t("copy"), async () => {
                        await navigator.clipboard.writeText(inviteLink(tokens[role]!))
                        notify(t("copied"))
                      })}
                      {c.invitedNpubs?.[role] &&
                        button(t("sendNostr"), async () => {
                          const { sendChallengeInvite } = await import("@/lib/challenges/nostr-invite")
                          try {
                            await sendChallengeInvite(
                              c.invitedNpubs![role]!,
                              t("dmBody", {
                                name: c.members.creator!.name,
                                title: c.title,
                                url: inviteLink(tokens[role]!),
                              }),
                            )
                          } catch (e) {
                            throw new Error(
                              t(e instanceof Error && e.message === "noInbox" ? "noInbox" : "dmError"),
                            )
                          }
                          notify(t("relayed"))
                        })}
                    </div>
                    {c.invitedNpubs?.[role] && <p className="text-sm text-muted-foreground">{t("dmHint")}</p>}
                  </>
                ) : (
                  button(t("rotateLink"), async () => {
                    const r = await act({ action: "invite", role })
                    setTokens((prev) => ({ ...prev, [role]: r.token }))
                  })
                )}
              </section>
            ),
        )}
      {me !== "moderator" &&
        c.stage === "funding" &&
        !myDeposit &&
        button(t("fund", { amount: c.stake }), async () => {
          const { fundDeposit } = await import("@/lib/challenges/cashu")
          await act({ action: "fund", token: await fundDeposit(walletId(), terms(), me) })
        })}
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
          {c.stage === "active" && (
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
                  {t("fees", {
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
                download("challenge-" + c.id + "-" + p + ".cashu", await redeemPayout(walletId(), receipt))
              })}
            </div>
          )
        )
      })}
      <details className={panel}>
        <summary>{t("backupKey")}</summary>
        <p className="text-sm">{t("keyHint")}</p>
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
