# Liberture — Internal Roadmap

Internal working doc — the living plan for where Liberture is going.
Edit freely as priorities change; move shipped items to Done with dates.

## Direction (decided 2026-07-31)

Liberture is a **self-hostable habit tracker**:
1. Users add protocols manually and customize them (steps → daily habits).
2. AI assistants manage the tracker through an API endpoint (scoped API keys).
3. Protocols are shareable with friends + a marketplace for community protocols.
4. **No Nostr / web-of-trust / decentralized-network stuff** — dropped explicitly.

The how-it-works page now sells this vision; most of it is still to be BUILT.

## Now

- [ ] Build the habit tracker core: `Habit` + `HabitLog` models, adopt-protocol flow
      (Protocol.steps → habits), streaks, completion rates. The page promises
      `/api/tracker/*` endpoints — make them real.
- [ ] Assistant API: scoped API keys (issue/revoke in dashboard), Bearer auth on
      `/api/tracker/*`. This is the differentiator — prioritize after core tracking.
- [ ] Protocol sharing: share-by-link, adopt-and-remix; marketplace already has
      models/routes (`MarketplaceItem`, `/marketplace`) to build on.
- [ ] Unify /marketplace with the protocol library — marketplace items and
      protocols are unrelated tables today; per the new direction the marketplace
      should surface protocols (with their why/references/relations).
- [ ] Admin form: add `why` textarea + relation editor (API PATCH already accepts
      `why`; relations only seedable via script for now).
- [ ] Protocols list page: surface relation counts / "part of a stack" badges;
      also fix pillar filtering for legacy capitalized pillar values (`Recovery`
      etc. never match pillar pages — normalize or migrate old rows).
- [ ] Rip out Nostr from the rest of the app (auth route `app/api/auth/nostr`,
      admin nostr-profiles, dashboard mentions) — how-it-works is clean, rest isn't.

## Next

- [ ] Decide which routes to gate behind the coming-soon page — `COMING_SOON_ROUTES`
      in `proxy.ts` shipped empty (candidates commented out: `/marketplace`, `/games`,
      `/protocols`), so the feature from PR #21 is live but dormant.
- [ ] Triage stale remote branches (~16, mostly `leonex/*`): review, merge or delete.
      Notable: 4 duplicate `refactor-similar-components-for-reuse-*` variants,
      `add-20-books-to-knowledge-base`, `implement-spider-diagram-for-scores`,
      `feat/coming-soon-and-404-handling` (superseded by PR #21?).

- [ ] Replace `prisma db push --accept-data-loss` in the deploy script with proper
      migrations (`prisma migrate deploy`) — current form can silently drop prod data
      on schema changes.
- [ ] Stop running `seed-directory-quick.ts` on every deploy (currently `|| true`
      on each push) — make seeding a one-off or idempotent-by-design step.
- [ ] Zero-downtime deploys: `pm2 delete` + `start` drops the site for a few seconds
      each push; switch to `pm2 reload` (needs cluster mode) or start-then-swap.

### Coach doctrine (from the retired `~/productivity-system`, 2026-10-10)

The coach and its limits shipped in #32 (check-ins, quiet hours, daily cap,
MCP coach tools). What it lacks is a point of view. Port the old Topolino
doctrine into it:

- [ ] **Message formula** for every check-in in `lib/habits/coach/rules.ts`:
      status in one sentence → the actual miss or risk → exactly one next action
      with a deadline. Brief and direct, no motivational filler, no vulgarity;
      Rioplatense Spanish for `es`.
- [ ] **Response ladder** using the nudge ledger (`habit_notifications_sent`):
      first miss = reminder + one action; repeated miss = name the pattern and
      shrink the ask; never repeat the same sermon.
- [ ] **Habit tiers**: core (strict; = focus habits / priority 4–5), secondary
      (mentioned, never hammered), zombie (0% for 30+ days and not core →
      suggest archiving, never nag). Lift the 3-focus-habit cap or add a
      "core" flag so 4–6 anchors fit.
- [ ] **Evening close check-in** (default 21:30): what got done, what failed,
      one change for tomorrow. Morning/afternoon already exist.
- [ ] **Weekly review prompts** (Sunday 19:00): what moved, what was fake
      motion, which failure pattern repeated, what gets cut, 3 commitments for
      next week.
- [ ] **Empty-board rule**: zero active todos is undefined work, not a free
      day. Nudge for one 15-minute starter task first, then the weekly three
      (career/finance, body/discipline, project), each with next action,
      estimated minutes, energy and "can the coach help" (fields exist on `Todo`).
- [ ] **Drift = core miss past its window, empty board, or no career/study
      block today** — feed `get_audit` and the afternoon check-in from this
      instead of the current priority-only rule.

## Later

- [ ] Bump GitHub Actions deps flagged by the Node 20 deprecation warning
      (`actions/checkout@v4`, `setup-node@v4`, `pnpm/action-setup@v4` → Node 24-ready).
- [ ] Health/uptime monitoring for liberture.com — the July 31 outage was only
      noticed by manually curling the site; the workflow health check helps but
      only fires on deploys.

## Done

- 2026-07-31 — Protocol library foundation (commit `1b4de15`): `why` field +
  `ProtocolRelation` model (synergy/alternative + note); 12 evidence-referenced
  protocols seeded (2/pillar, published, canonical pillar ids) cross-linked by
  13 relations; detail page now renders Why This Works, Works Well With,
  Same Goal Different Route, and Sources & References (previously a dead field).
- 2026-07-31 — Direction pivot committed to the site: rewrote /how-it-works around
  the self-hostable habit tracker + AI-assistant API + sharing/marketplace story,
  dropped all Nostr/OpenClaw/wearables philosophy (commit `6c00403`).
- 2026-07-31 — Merged PR #21 (coming-soon page, Next 16 `proxy.ts`, pillar dropdown
  colors) with fixes: Suspense wrapper for `useSearchParams`, dropped stray wordmark
  SVG, kept master's safer pillar-color code.
- 2026-07-31 — Fixed prod outage + deploy script: non-interactive pnpm (`CI=true`),
  `set -e` before touching pm2, pnpm pinned to major 10, post-restart health check
  (commit `28e1111`).
