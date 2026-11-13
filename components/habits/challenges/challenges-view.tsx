"use client"

import { useContext, createContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { PlayerProfile } from "./player-profile"
import { useTranslations } from "next-intl"
import { ArrowLeft, Check, Gavel, Trophy } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/habits/ui/popover"
import { Button } from "@/components/ui/button"
import { ChallengeTerms } from "./challenge-terms"
import { useHabitsSession } from "@/components/habits/session-provider"
import type { Challenge } from "@/lib/challenges/types"
import { MAX_STAKE, TEST_MINT } from "@/lib/challenges/mints"
import { CopyButton } from "@/components/habits/ui/copy-button"
import { useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import type { ProfileMatch } from "@/lib/habits/nostr/search-profiles"
import { NostrRecipient, recipientPublicKey } from "./invite-target"
import { FieldSelect, FieldOption } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CashewMatch, ChallengeStepArt } from "./cashew-match"
import { MatchHeading } from "./match-heading"
import { ChallengeDetail } from "./detail"
import { Field, inviteLink, panel, rememberWallet, useAction, useChallengeClient } from "./common"

function useSelection() {
  const [selected,setSelected] = useState<Challenge | null>(null)
  const [links,setLinks] = useState<Partial<Record<"player" | "moderator", string>>>({})
  return {selected,setSelected,links,setLinks}
}
const Selection = createContext<ReturnType<typeof useSelection> | null>(null)
export function ChallengeSelectionProvider({children}: {children: ReactNode}) {
  const selection = useSelection()
  return <Selection.Provider value={selection}>{children}</Selection.Provider>
}
export function ChallengesView({creating = false}: {creating?: boolean}) {
  const router = useRouter()
  const t = useTranslations("challenges")
  const { request, isChecking } = useChallengeClient()
  const { profile, auth } = useHabitsSession()
  const creatorName = (profile?.name || profile?.nip05 || auth.pubkey?.slice(0,12) || t("creator")).slice(0,48)
  const [duration, setDuration] = useState("14")
  const [stake, setStake] = useState("100")
  const [moderatorNpub, setModeratorNpub] = useState("")
  const [moderatorMatch, setModeratorMatch] = useState<ProfileMatch>()
  const moderatorProfile = useNostrProfile(recipientPublicKey(moderatorNpub))
  const [moderatorOpen, setModeratorOpen] = useState(false)
  const [items, setItems] = useState<Challenge[] | null>(null)
  const {selected,setSelected,links,setLinks} = useContext(Selection)!
  const [draftToken, setDraftToken] = useState("")
  useEffect(() => {
    if (creating) setDraftToken(btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""))
  }, [creating])
  const [listError, setListError] = useState(false)
  const [retry, setRetry] = useState(0)
  const { run, busy, error } = useAction()
  useEffect(() => {
    if (isChecking) return
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

  const detail = !creating && selected && (
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
  function open(item: Challenge) {
    if (creating) router.push("/tracker/challenges")
    if (item.id !== selected?.id) setLinks({})
    setSelected(item)
  }
  function list(rows: Challenge[]) {
    return rows.map(item => (
      <div key={item.id} className="rounded-xl border border-border bg-card p-3">
      <button type="button" onClick={() => open(item)} className="block w-full text-left hover:text-primary" aria-current={selected?.id === item.id ? "page" : undefined}>
        <MatchHeading creator={item.members.creator!.name} player={item.members.player?.name || item.invitedPlayerName} joined={!!item.members.player} stage={item.stage} />
        <span className="block text-sm text-muted-foreground">{item.title} · {t(item.mint === TEST_MINT ? "satsEach" : "liveSats", {amount:item.stake})}</span>
      </button>
      </div>
    ))
  }
  const [keyword, setKeyword] = useState("")
  const [status, setStatus] = useState("all")
  const query = keyword.trim().toLocaleLowerCase()
  const filtered = items?.filter(item =>
    (status === "all" || item.stage === status) &&
    [item.title, item.rules, item.members.creator?.name, item.members.player?.name, item.invitedPlayerName, item.members.moderator?.name]
      .some(value => value?.toLocaleLowerCase().includes(query))
  ) ?? []
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 pb-8 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
      <aside className="order-2 space-y-2 md:order-none md:sticky md:top-4 md:max-h-[85dvh] md:self-start md:overflow-auto" aria-label={t("history")}>
        <h2 className="font-semibold">{t("history")}</h2>
        <Input type="search" aria-label={t("searchChallenges")} placeholder={t("searchChallenges")} value={keyword} onChange={event => setKeyword(event.target.value)} />
        <FieldSelect className="w-full" aria-label={t("filterStatus")} value={status} onValueChange={setStatus}>
          <FieldOption value="all">{t("allStatuses")}</FieldOption>
          {(["inviting","funding","active","disputed","settling","settled","expired"] as const).map(stage => <FieldOption key={stage} value={stage}>{t(stage)}</FieldOption>)}
        </FieldSelect>
        {listError ? <Button variant="outline" onClick={() => setRetry(r => r + 1)}>{t("retryList")}</Button>
          : filtered.length ? list(filtered) : <p className="text-sm text-muted-foreground">{t(!items ? "loading" : keyword || status !== "all" ? "noMatches" : "empty")}</p>}

      </aside>
      <section className="min-w-0 space-y-4">
      {creating ? <Button variant="ghost" type="button" disabled={busy} onClick={() => {setSelected(null);router.push("/tracker/challenges")}}>
        <ArrowLeft aria-hidden className="size-4" />{t("back")}
      </Button> : !detail && <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <Trophy className="size-6 text-primary" />
          {t("title")}
        </h2>
        <Button onClick={() => {setSelected(null);setLinks({});router.push("/tracker/challenges/new")}}>{t("new")}</Button>
      </header>}
      {!creating && !detail && <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("howItWorks")}</h3>
        <ol className="grid gap-3 sm:grid-cols-3">
          {(["invite", "play", "finish"] as const).map((step, i) => (
            <li key={step} className="grid content-start gap-2">
              <ChallengeStepArt step={step} />
              <div className="flex gap-2">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <div><strong className="text-sm">{t(`steps.${step}`)}</strong><p className="text-sm text-muted-foreground">{t(`steps.${step}Hint`)}</p></div>
              </div>
            </li>
          ))}
        </ol>
      </section>}
      {detail || (creating ? (
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
                name: creatorName,
                playerInvite: draftToken,
                pubkey,
                stake: Number(body.stake),
                durationDays: Number(body.durationDays),
                playerNpub: String(body.playerNpub ?? "").trim() || undefined,
                moderatorNpub: moderatorNpub || undefined,
              })
              setLinks(response.invites)
              setSelected(response.challenge)
              router.replace("/tracker/challenges")
            })
          }}
        >
          <CashewMatch compact versus={t("versus")} moderatorDetails={moderatorNpub &&
            <PlayerProfile small name={moderatorProfile?.name || moderatorMatch?.name || moderatorProfile?.nip05 || moderatorMatch?.address || moderatorNpub.slice(0, 12) + "…"}
              picture={moderatorProfile?.picture || moderatorMatch?.picture} />}
            moderator={moderatorOpen || Boolean(moderatorNpub)} corner={
            <Popover open={moderatorOpen} onOpenChange={setModeratorOpen}>
              <PopoverTrigger asChild>
                <Button type="button" size="icon-sm" variant="outline" aria-label={t("moderatorPicker")} title={t("moderatorPicker")}>
                  <Gavel aria-hidden className={moderatorNpub ? "text-primary" : undefined} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" collisionPadding={12} aria-label={t("moderatorPicker")} className="grid max-h-[min(20rem,65dvh)] w-64 max-w-[90vw] gap-2 overflow-y-auto">
                <NostrRecipient nameField="moderatorNpub" defaultQuery={moderatorNpub} onRecipientChange={(npub, match) => { setModeratorNpub(npub); setModeratorMatch(match) }} optional />
                {moderatorNpub && <Button type="button" size="sm" variant="ghost" onClick={() => {
                  setModeratorNpub("")
                  setModeratorOpen(false)
                }}>{t("removeModerator")}</Button>}
              </PopoverContent>
            </Popover>
          }>
            <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 self-center text-center">
              <PlayerProfile name={creatorName} picture={profile?.picture} />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <NostrRecipient nameField="playerNpub" optional action={
                <CopyButton shareIconOnly disabled={!draftToken} value={draftToken ? inviteLink(draftToken) : ""} label={t("byLink")} copiedLabel={t("copied")} successMessage={t("draftLinkCopied")} errorMessage={t("copyFailed")} />
              } />
            </div>
          </CashewMatch>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ChallengeTerms days={Number(duration)} />
          <div className="min-w-0 space-y-4">
            <PresetField label={t("liveStake")} name="stake" value={stake} setValue={setStake} max={MAX_STAKE} options={[100,1000,5000,10000]} />
            <PresetField label={t("days")} name="durationDays" value={duration} setValue={setDuration} max={90} options={[1,7,14,30]} />
          </div>
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button disabled={busy}>{t("create")}</Button>
          </div>
        </form>
      ) : null)}
      </section>
    </div>
  )
}

function PresetField({ label, name, value, setValue, max, options }: { label: string; name: string; value: string; setValue: (value: string) => void; max: number; options: number[] }) {
  return <div className="min-w-0 space-y-2">
    <Field label={label} name={name} type="number" min={1} max={max} required value={value} onChange={e=>setValue(e.target.value)} />
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {options.map(amount => {
        const selected = Number(value) === amount
        const tint = name === "stake"
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-300/15 dark:text-amber-200 dark:hover:bg-amber-300/25"
          : "bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-300/15 dark:text-sky-200 dark:hover:bg-sky-300/25"
        return <Button key={amount} type="button" size="sm" variant="ghost" aria-pressed={selected}
          className={`h-6 min-w-7 gap-1 rounded-full px-2 py-0 text-xs tabular-nums has-[>svg]:px-2 aria-pressed:ring-1 aria-pressed:ring-inset aria-pressed:ring-current ${tint}`}
          onClick={() => setValue(String(amount))}>
          {selected && <Check aria-hidden className="size-3" />}{amount}
        </Button>
      })}
    </div>
  </div>
}
