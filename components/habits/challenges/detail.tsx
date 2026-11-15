"use client"

import { challengeNextAction } from "@/lib/challenges/next-action"
import { ChallengeRace } from "./race"
import Link from "next/link"
import { TEST_MINT } from "@/lib/challenges/mints"
import { useHabitsSession } from "@/components/habits/session-provider"
import { PlayerProfile } from "./player-profile"
import { payWithWebLn } from "@/lib/challenges/webln"
import { LoaderCircle, Share2 } from "lucide-react"
import { useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import { recipientPublicKey } from "./invite-target"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { CopyButton } from "@/components/habits/ui/copy-button"
import { AppToaster, notify } from "@/components/habits/ui/toast"
import { QrCode } from "@/components/habits/qr-code"
import { NostrRecipient } from "./invite-target"
import { CashewMatch } from "./cashew-match"
import { useEffect, useRef, useState } from "react"
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

export function ChallengeRoom({ id, startPayment = false }: { id: string; startPayment?: boolean }) {
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
      <AppToaster />
      {challenge ? <ChallengeDetail initial={challenge} startPayment={startPayment} /> : <p>{error || t("loading")}</p>}
    </main>
  )
}

export function ChallengeDetail({
  initial,
  back,
  startPayment = false,
}: {
  initial: Challenge
  back?: () => void
  startPayment?: boolean
}) {
  const t = useTranslations("challenges")
  const { request } = useChallengeClient()
  const locale = useLocale()
  const [c, setChallenge] = useState(initial)
  const [tokens, setTokens] = useState<Invites>({})
  const [inviteRole, setInviteRole] = useState<"player" | "moderator" | null>(null)
  const [choice, choose] = useState<Result | null>(null)
  const { busy, error, run } = useAction()
  const path = "/" + c.id
  function update(next: Challenge) {
    setChallenge((prev) => (next.revision >= prev.revision ? next : prev))
  }
  useEffect(() => {

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
    void refresh()
    const timer = c.stage === "settled" ? undefined : setInterval(refresh, 10000)
    window.addEventListener("focus", refresh)
    return () => {
      live = false
      clearInterval(timer)
      window.removeEventListener("focus", refresh)
    }
  }, [request, path, c.stage])
  async function act(command: ChallengeAction) {
    const response = await request<{ challenge: Challenge; token?: string }>(path, "PATCH", command)
    if (response.challenge.deposits.creator && response.challenge.deposits.player) {
      const latest = await request<{ challenge: Challenge }>(path)
      update(latest.challenge)
    } else update(response.challenge)
    return response
  }
  const me = c.role
  const externalModerator = me === "moderator" && c.arbitration === "nostr"
  const myKey = c.members[me]!.pubkey
  const { auth, profile } = useHabitsSession()
  const opponentProfile = useNostrProfile(recipientPublicKey(c.invitedNpubs?.player || ""))
  const moderatorProfile = useNostrProfile(recipientPublicKey(c.invitedNpubs?.moderator || ""))
  const [recoveryNeeded, setRecoveryNeeded] = useState(false)
  const [restored, setRestored] = useState(0)
  useEffect(() => {
    const account = auth.pubkey
    if (!account || externalModerator) return
    const controller = new AbortController()
    async function backup() {
      if (!account || controller.signal.aborted) return
      const { backUpChallengeKey } = await import("@/lib/challenges/key-backup")
      await backUpChallengeKey(c.id, myKey, account, controller.signal)
    }
    const retry = () => { void backup().catch(() => { /* Retry quietly when online. */ }) }
    retry()
    const interval = window.setInterval(retry, 120000)
    window.addEventListener("online", retry)
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener("online", retry) }
  }, [auth.pubkey, externalModerator, c.id, myKey, restored])
  function walletId() {
    const id = localStorage.getItem("challenge-wallet-for:" + myKey)
    if (!id) { setRecoveryNeeded(true); throw new Error(t("walletUnavailable")) }
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
          await task()
        })
      }
    >
      {text}
    </Button>
  )
  const [paidQuote, setPaidQuote] = useState<string>()
  const [advancePaid, setAdvancePaid] = useState(false)
  const [reclaimToken, setReclaimToken] = useState("")
  const [savedAdvance, setSavedAdvance] = useState(false)
  const [advanceReady, setAdvanceReady] = useState(false)
  const [statusRetry, setStatusRetry] = useState(0)
  const [statusFailed, setStatusFailed] = useState(false)
  const deposit = c.deposits.creator
  const {id, mint, stake} = c
  useEffect(() => {
    if (me !== "creator" || deposit || busy) return
    const owner = localStorage.getItem("challenge-wallet-for:" + myKey)
    let live = true
    let timer: number | undefined
    let checking = false
    async function refresh() {
      if (checking || !live) return
      checking = true
      window.clearTimeout(timer)
      try {
        const { readAdvancePayment } = await import("@/lib/challenges/cashu")
        const result = owner ? await readAdvancePayment(owner, {id, mint, stake}, myKey) : null
        if (!live) return
        setSavedAdvance(Boolean(result))
        setAdvancePaid(Boolean(result?.paid))
        setPaidQuote(result?.quote)
        setReclaimToken(result?.token || "")
        if (result || c.stage === "inviting") setInvoice(result?.invoice || "")
        setStatusFailed(false)
        setAdvanceReady(true)
        if (result?.invoice) timer = window.setTimeout(refresh, 8000)
      } catch {
        if (live) { setStatusFailed(true); setAdvanceReady(false) }
      } finally { checking = false }
    }
    void refresh()
    window.addEventListener("focus", refresh)
    return () => { live = false; window.clearTimeout(timer); window.removeEventListener("focus", refresh) }
  }, [me, myKey, id, mint, stake, deposit, c.stage, busy, statusRetry])
  const offeredInvoice = useRef("")
  async function offerInvoice(request: string) {
    if (offeredInvoice.current === request) {
      setInvoice(request)
      return false
    }
    offeredInvoice.current = request
    setInvoice(request)
    const submitted = await payWithWebLn(request)
    return submitted
  }

  async function checkAdvance(reclaim = false, pay = false) {
    const { advancePayment } = await import("@/lib/challenges/cashu")
    const owner = walletId()
    let result = await advancePayment(owner, c, myKey, reclaim)
    if (pay && result.invoice && await offerInvoice(result.invoice)) {
      result = await advancePayment(owner, c, myKey)
    }
    setInvoice(result.invoice || "")
    setAdvancePaid(Boolean(result.paid))
    setPaidQuote(result.quote)
    setReclaimToken(result.token || "")
    if (result.token) { setTokens({}); setInviteRole(null) }
    if (result.token && reclaim) download("challenge-" + c.id + "-reclaimed.cashu", result.token)
    setSavedAdvance(true)
  }
  const [expandedQr, setExpandedQr] = useState(false)
  const [invoice, setInvoice] = useState("")
  const test = c.mint === TEST_MINT
  const expired = c.stage === "expired"
  const canInvite = !!deposit || !!paidQuote && !reclaimToken
  const myDeposit = me !== "moderator" && c.deposits[me]
  const myRefund = me !== "moderator" ? c.refunds[me] : undefined
  const moderatorSigned = !!c.settlements.creator?.signatures.moderator
  const signatures = Object.keys(c.settlements.creator?.signatures ?? {}).length
  const nextAction = challengeNextAction(c, advancePaid)
  const paymentInFlight = useRef(false)
  const autoPaymentStarted = useRef(false)
  async function fundPayment(offerWallet = false) {
    if (me === "moderator" || paymentInFlight.current) return
    paymentInFlight.current = true
    try {
      const { fundDeposit, existingChallengeKey } = await import("@/lib/challenges/cashu")
      const owner = walletId()
      if (!existingChallengeKey(owner, myKey)) { setRecoveryNeeded(true); throw new Error(t("walletUnavailable")) }
      const token = await fundDeposit(owner, terms(), me, async request => {
        if (expired) return
        setInvoice(request)
        if (offerWallet) await offerInvoice(request)
      })
      await act({ action: "fund", token })
      setInvoice("")
    } catch (failure) {
      // An invoice still awaiting payment is a normal state, not a failed action.
      if (!(failure instanceof Error && failure.message === "Invoice awaiting payment.")) throw failure
    } finally { paymentInFlight.current = false }
  }
  useEffect(() => {
    if (!startPayment || autoPaymentStarted.current || me !== "player" || c.stage !== "funding" || myDeposit) return
    autoPaymentStarted.current = true
    const intentKey = "challenge:start-payment:" + c.id
    const stored = sessionStorage.getItem(intentKey)
    sessionStorage.removeItem(intentKey)
    let intended = false
    try { const intent = JSON.parse(stored || "null"); intended = intent?.key === myKey && intent?.stake === c.stake } catch { /* Invalid or stale intent. */ }
    const url = new URL(location.href)
    url.searchParams.delete("pay")
    history.replaceState(null, "", url)
    if (intended) void run(() => fundPayment(true))
  }, [startPayment, me, c.stage, myDeposit])
  useEffect(() => {
    if (me === "moderator" || myDeposit || c.stage !== "funding") return
    let live = true
    let checking = false
    const refresh = async () => {
      if (checking || paymentInFlight.current || document.hidden) return
      const owner = localStorage.getItem("challenge-wallet-for:" + myKey)
      if (!owner) return
      checking = true
      try {
        const { readFundingPayment } = await import("@/lib/challenges/cashu")
        const pending = await readFundingPayment(owner, terms(), me)
        if (!live || !pending) return
        if (pending.paid) await run(() => fundPayment())
        else setInvoice(pending.expired ? "" : pending.invoice || "")
      } catch { /* Keep the explicit retry available if the mint is unreachable. */ }
      finally { checking = false }
    }
    void refresh()
    const timer = window.setInterval(refresh, 5000)
    window.addEventListener("focus", refresh)
    return () => { live = false; clearInterval(timer); window.removeEventListener("focus", refresh) }
  }, [me, myKey, c.id, c.stage, myDeposit])
  return (
    <section className="mx-auto w-full max-w-2xl space-y-4 pb-8">
      {back && (
        <Button variant="ghost" onClick={back}>
          {t("back")}
        </Button>
      )}
      <header className={panel}>
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 break-words text-xl font-semibold">{c.title}</h1>
          {c.publicMatch ? <CopyButton value={new URL("/challenges/watch/" + c.id, location.origin).href} label={t("copyPublic")} copiedLabel={t("copied")} successMessage={t("publicCopied")} errorMessage={t("publicCopyFailed")} /> :
            me === "creator" && canInvite && <Button variant="outline" size="sm" disabled={busy} onClick={() => void run(async () => { await act({action:"publish", quote:paidQuote}); notify.success(t("publicReady")) })}>{t("publishMatch")}</Button>}
        </div>
        {c.deposits.creator && c.deposits.player ? <>
          <ChallengeRace names={{creator:c.members.creator!.name, player:c.members.player!.name}} days={c.durationDays} progress={c.race ?? {creator:0,player:0}} />
          {me !== "moderator" && c.stage === "active" && (me === "player" && c.guestDays ? <div className="flex flex-wrap gap-2">
            {Array.from({length:Math.min(c.durationDays, Math.max(0, c.durationDays + 1 + Math.floor((Date.now()/1000 - c.expiresAt!)/86400)))}, (_,i) => i+1).map(day =>
              <Button key={day} size="sm" variant="outline" aria-pressed={c.guestDays!.includes(day)} disabled={busy} onClick={() => void run(async () => {
                await act({action:"guestDay", day, complete:!c.guestDays!.includes(day)})
              })}>{c.guestDays!.includes(day) ? "✓ " : ""}{t("raceDay",{day})}</Button>)}
          </div> : <Link className="text-sm text-primary underline" href="/tracker/todos">{t("openRaceTasks")}</Link>)}
        </> : <CashewMatch compact waiting={!c.members.player || !c.deposits.player} waitingCreator={!c.deposits.creator && !advancePaid} stage={c.stage} result={c.result} joined={!!c.members.player}
          versus={t("versus")} moderator={c.arbitration !== "none" && !!(c.members.moderator || c.invitedNpubs?.moderator)}
          moderatorDetails={c.members.moderator && <PlayerProfile small name={moderatorProfile?.name || c.members.moderator.name} picture={moderatorProfile?.picture} />}>
          {players.map(role => {
            const member = c.members[role]
            const info = me === role ? profile : role === "player" ? opponentProfile : null
            const name = info?.name || member?.name || c.invitedPlayerName || t("secondPlayer")
            return <div key={role} className="flex min-w-0 flex-wrap items-center justify-center gap-1 text-center">
              {!c.deposits[role] && !(role === "creator" && advancePaid) && <span role="status"><LoaderCircle aria-hidden className="size-4 opacity-[.65] motion-safe:animate-spin" /><span className="sr-only">{t(member ? "waitingPayment" : "pendingInvite")}</span></span>}
              <PlayerProfile name={name} picture={info?.picture} />
              {role === "player" && !member && me === "creator" && canInvite && <Button size="icon-sm" variant="ghost" aria-label={t("shareInvite")} title={t("shareInvite")} onClick={() => setInviteRole("player")}><Share2 aria-hidden /></Button>}
              {c.deposits[role] && <small className="w-full">{t(c.refunds[role]?.receipt ? "refunded" : c.settlements[role]?.receipt ? "settled" : "funded")}</small>}
            </div>
          })}
        </CashewMatch>}
        <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4" aria-label={t("nextStep")}>
          <h2 className="font-semibold text-primary">{t(`action.${nextAction.kind}Title`, {name:nextAction.name || t("secondPlayer"),amount:c.stake})}</h2>
          <p className="text-sm text-muted-foreground">{t(`action.${nextAction.kind}Body`, {name:nextAction.name || t("secondPlayer"),amount:c.stake})}</p>

      {me === "creator" && !myDeposit && statusFailed && button(t("checkAdvance"), async () => setStatusRetry(n => n + 1))}
      {advanceReady && me === "creator" && !myDeposit && (c.stage === "inviting" || savedAdvance) && <div className="space-y-2">
        {reclaimToken ? button(t("downloadReclaimed"), async () => download("challenge-" + c.id + "-reclaimed.cashu", reclaimToken)) : <>
          {c.stage === "inviting" && !advancePaid && button(t(invoice ? "checkAdvance" : "payAdvance", {amount:c.stake}), () => checkAdvance(false, !invoice))}
          {savedAdvance && !advancePaid && !invoice && c.stage !== "inviting" && button(t("checkAdvance"), () => checkAdvance())}
          {advancePaid && button(t("reclaimAdvance", {amount:c.stake}), () => checkAdvance(true))}
        </>}
      </div>}
      {me !== "moderator" && (me !== "creator" || advanceReady) &&
        (c.stage === "funding" || expired && (c.members.moderator || c.arbitration === "none") && c.members.player) &&
        !myDeposit &&
        button(t(expired ? "recoverDeposit" : invoice ? "checkAdvance" : savedAdvance && !reclaimToken ? "lockAdvance" : "payAndJoin", { amount: c.stake }), () => fundPayment(!invoice && !savedAdvance))}
      {invoice && !myDeposit && !expired && <div className="grid justify-items-start gap-2">
        <h3 className="flex items-center gap-2"><LoaderCircle aria-hidden className="size-4 animate-spin" />{t("waitingPayment")}</h3>
        <button type="button" className="w-64 max-w-full justify-self-center scroll-mb-32 cursor-zoom-in" aria-label={t("expandInvoice")} onClick={() => setExpandedQr(true)}>
          <QrCode value={invoice.toUpperCase()} title={t("payInvoice")} className="w-full h-auto scroll-mb-32" />
        </button>
        <AppDialog size="sm" title={t("payInvoice")} open={expandedQr} onClose={() => setExpandedQr(false)}>
          <QrCode value={invoice.toUpperCase()} title={t("payInvoice")} className="mx-auto w-80 max-w-full h-auto" />
        </AppDialog>
        <a className="underline" href={"lightning:"+invoice}>{t("openWallet")}</a>
        <CopyButton value={invoice} label={t("copyInvoice")} copiedLabel={t("copied")} errorMessage={t("invoiceCopyError")} />
      </div>}

        </section>
        <div className="flex flex-wrap items-center gap-2">
          {canInvite && me === "creator" && !c.members.moderator && c.arbitration !== "none" && <Button size="sm" variant="outline" onClick={() => setInviteRole("moderator")}>{t("inviteRole",{role:t("moderator")})}</Button>}

        </div>
        <h2 className="text-sm font-semibold">{t("agreedRules")}</h2>
        <p className="whitespace-pre-wrap">{c.rules}</p>
        <p>
          {t(test ? "satsEach" : "liveSats", { amount: c.stake })} · {t("duration", { days: c.durationDays })}
        </p>
        {test && <p className="text-sm text-muted-foreground">{t("testMint")}</p>}
        {c.expiresAt && <p>{t("deadline", { date: new Date(c.expiresAt * 1000).toLocaleString(locale) })}</p>}
      </header>
      {me === "creator" && canInvite &&
        (["player", "moderator"] as const).map(
          (role) =>
            !c.members[role] && (role !== "moderator" || c.arbitration !== "none") && (
              <AppDialog key={role} size="sm" open={inviteRole === role} onClose={() => setInviteRole(null)} title={t("inviteRole",{role:t(role)})} description={t("inviteHelp")}>
                <div className="flex flex-wrap items-center gap-2">
                  {tokens[role] ? (
                    <CopyButton value={inviteLink(tokens[role]!)} label={t("copyLink")} copiedLabel={t("copied")} successMessage={t("inviteCopied")} errorMessage={t("copyFailed")} disabled={busy} />
                  ) : (
                    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void run(async () => {
                      const r = await act({ action: "invite", role, quote: paidQuote })
                      setTokens(prev => ({ ...prev, [role]: r.token }))
                      notify.info(t("linkReady"))
                    })}>{t("rotateLink")}</Button>
                  )}
                </div>
                <form className="mt-2 grid gap-2 border-t pt-3" onSubmit={e => {
                  e.preventDefault()
                  const recipient = String(new FormData(e.currentTarget).get("recipient"))
                  void run(async () => {
                    let token = tokens[role]
                    if (!token) {
                      token = (await act({ action: "invite", role, quote: paidQuote })).token
                      setTokens(prev => ({ ...prev, [role]: token }))
                    }
                    if (!token) throw new Error(t("dmError"))
                    const { sendChallengeInvite } = await import("@/lib/challenges/nostr-invite")
                    try {
                      await sendChallengeInvite(recipient, t("dmBody", { name: c.members.creator!.name, title: c.title, url: inviteLink(token) }))
                    } catch (e) {
                      throw new Error(t(e instanceof Error && e.message === "noInbox" ? "noInbox" : "dmError"))
                    }
                    notify.success(t("relayed"))
                  })
                }}>
                  <NostrRecipient nameField="recipient" sendBusy={busy} initialNpub={c.invitedNpubs?.[role]} />
                </form>
                {error && <p role="alert">{error}</p>}
              </AppDialog>
            ),
        )}
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
                    (externalModerator ? <div className="space-y-2">
                      <p>{t("externalSigning")}</p>
                      {button(t("downloadRequests"), async () => {
                        const { externalPayoutRequest } = await import("@/lib/challenges/cashu")
                        const requests: Partial<Record<Player,string>> = {}
                        for (const p of players) requests[p] = await externalPayoutRequest(terms(),p,c.deposits[p]!,c.result!,c.settlements[p]!.plan)
                        download("cashu-payout-requests.json", JSON.stringify(requests,null,2))
                      })}
                      <label className="grid gap-1">{t("importRequests")}
                        <input type="file" accept=".json,application/json" disabled={busy} onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          void run(async () => {
                            const { readExternalSignature } = await import("@/lib/challenges/cashu")
                            const signatures: Partial<Record<Player,string>> = {}
                            try {
                              if (file.size > 262144) throw new Error()
                              const packages = JSON.parse(await file.text())
                              for (const p of players) {
                                const sig = readExternalSignature(c.settlements[p]!.plan,myKey,packages[p])
                                if (!sig) throw new Error()
                                signatures[p] = sig
                              }
                            } catch { throw new Error(t("invalidSignatures")) }
                            await act({action:"sign",signatures})
                          })
                        }} />
                      </label>
                    </div> : button(t("sign"), async () => {
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
                    }))}
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
      {!externalModerator && <AppDialog open={recoveryNeeded} onClose={() => setRecoveryNeeded(false)} title={t("recoverAccess")}>
        <p className="text-sm">{t("recoverFromInbox")}</p>
        <label className="grid gap-1">
          {t("restoreKey")}
          <input
            type="file"
            accept=".key,.json,.txt,text/plain,application/json"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void run(async () => {
                const wallet = await import("@/lib/challenges/cashu")
                const id = crypto.randomUUID()
                let key = (await file.text()).trim()
                if (key.startsWith("{")) key = JSON.parse(key).signingKey
                wallet.importChallengeKey(id, key)
                if (wallet.challengePublicKey(id) !== myKey) throw new Error(t("wrongKey"))
                rememberWallet(myKey, id)
                setRecoveryNeeded(false)
                setRestored(n => n + 1)
              })
            }}
          />
        </label>
      </AppDialog>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
