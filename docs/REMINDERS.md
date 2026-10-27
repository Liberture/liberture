# Reminders and coach check-ins

How Liberture delivers habit reminders and coach check-ins, including when the app is closed, and how to set it up.

## Setup

Server push needs a VAPID key pair. Generate one **once** and keep it: changing keys invalidates every device's subscription.

```bash
node scripts/generate-vapid-keys.mjs
```

It prints three lines. Add them to the server environment:

| Deployment | Where |
|---|---|
| liberture.com (pm2, `.github/workflows/deploy.yml`) | The `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` repository secrets (`node scripts/generate-vapid-keys.mjs > ~/vapid.env && gh secret set -f ~/vapid.env`). The deploy appends them to `.env` after `ENV_PRODUCTION` |
| Docker (`compose.liberture-habits.yaml`) | `.env.liberture-habits`, then `up -d --no-deps app` |
| Local | `.env` |

| Variable | Purpose |
|---|---|
| `VAPID_PUBLIC_KEY` | Public key; browsers subscribe with it (`GET /api/habits/push/public-key`) |
| `VAPID_PRIVATE_KEY` | Signs pushes. Secret |
| `VAPID_SUBJECT` | Contact for push services. Default `mailto:hello@liberture.com` |
| `REMINDER_SCHEDULER` | `off` disables the server scheduler (e.g. on a second instance you don't want sending) |
| `HABIT_TRACKER_TIME_ZONE` | Fallback zone for users who haven't saved one |

The tables (`habit_push_subscriptions`, `habit_notifications_sent`, `habit_push_actions`) are created by `prisma db push` in the deploy. The Docker app also creates them lazily on first use.

**Without the keys** nothing breaks:
- the scheduler logs `[reminders] scheduler not started: …` once and stays off;
- `public-key` returns 503, so Settings disables the "also when closed" switch and explains why;
- reminders still fire from an open tab, deduplicated through the server (below).

## How it works

```
instrumentation.ts ──▶ scheduler (every 60 s, one process via pg_try_advisory_lock)
                         │  for each user with a push subscription and reminders on:
                         │    local time from preferences.timeZone
                         │    dueReminders()  → habit reminders   (lib/habits/reminders/due.ts)
                         │    tick handlers   → coach check-ins   (lib/habits/coach/checkins.ts)
                         ▼
                 claimNotification(key)  ── INSERT … ON CONFLICT DO NOTHING into habit_notifications_sent
                         │ first claim only
                         ▼
                 sendPush() ──▶ every device's subscription ──▶ public/sw.js "push" → notification
```

- **When a habit reminder fires:** from the habit's time until 15 minutes after it. The habit must be due today and not done, and it must not be archived.
  - "Due" means a times-per-week habit stops being due once that week's target is met (`isHabitDueOnDate` in `lib/habits/habit-utils.ts`).
  - Habits with no time get no reminder.
- **Random reminders** (`randomRemindersEnabled`): 1 or 2 fixed slots per habit per day between 09:00 and 20:00, picked from a hash of the habit and the date. They respect quiet hours. A habit's own time always fires.
- **One delivery per reminder.** Each reminder has a key, for example `habit:<id>:<YYYY-MM-DD>:habit`. Whoever claims it first in `habit_notifications_sent` sends it; everyone else skips it. That covers server ticks, several server processes, open tabs and other devices, so reloading or a second tab never repeats a reminder.
- **Open tabs** (`components/habits/notification-manager.tsx`):
  - When this device has a push subscription, the tab sends nothing; the server does it.
  - Otherwise, for example when push is unsupported, the tab checks every minute and claims through `POST /api/habits/push/claim` before showing anything.
  - Offline, it falls back to a per-day list in localStorage.
- **Dead subscriptions** (the push service answers 404 or 410) are deleted. Other failures increase `failures` and set `last_failure_at`.
- **Tapping a notification** opens its `url` (default `/tracker`). When the browser rotates a subscription, `pushsubscriptionchange` in `sw.js` re-subscribes it.

What `habit_notifications_sent.kind` holds (what `get_reminder_status` counts by kind):

| Kind | Sent by | Counts toward |
|---|---|---|
| `habit` | Habit reminders (`habit:<id>:<date>:<kind>`) | Nothing |
| `coach:<kind>` | Check-ins, daytime pulses (`coach:pulse`), assistants' `record_coach_nudge` | `maxNudgesPerDay` |
| `log:habit`, `log:todo` | Assistant receipts | Their own cap of 50 a day |

## Coach check-ins

These are configured in Settings → Preferences → Coach, stored in `preferences.coach`, and all off by default:

| Check-in | When | Says |
|---|---|---|
| Morning | Your time | Two priorities (due habits, todos due or overdue) and a first step |
| Afternoon | Your time | The next item whose time hasn't passed |
| Weekly | Day + time | What worked, what slipped, one change, worded as a proposal |
| Missed logging | 18:00 | A habit with no record for 3+ due days: "skipped, or forgot to log?" A "not done" record counts as logged |

Limits apply to every coach: Liberture's push check-ins and an assistant's automations alike. They live in `lib/habits/coach/limits.ts`:
- **Quiet hours:** default 22:00–08:00. The window may wrap past midnight.
- **Daily cap:** `maxNudgesPerDay`, default 3. It counts only coach nudges; habit reminders don't count.
- **One per kind:** one nudge of each kind per day, and one weekly review per ISO week. The exception is `other`: it's checked per message, so different one-off messages are each allowed until the daily limit, while the same message twice is a duplicate.

Server check-ins only run for users with a subscribed device, so they never use up a day's slot that an assistant could have used.

### Daytime pulses

**Random check-ins** (Settings → Preferences → Coach, `coach.pulsesPerDay`, 0–3, off by default) are a few unprompted pushes at random times.

- **When:** the waking day runs from the end of quiet hours to their start, with 30 minutes off each edge (08:30–21:30 by default). It is cut into equal parts, and each part gets one minute picked from a hash of the user and the date (`pulseSlots` in `lib/habits/coach/pulse-rules.ts`). A pulse fires in the 5 minutes from its slot.
- **What:** each pulse rotates through four sources by day and slot, skipping any with nothing to say:
  - a pending coach suggestion (not dismissed, snoozed or already adopted), linking to the coach tab;
  - today's progress ("2 of 5 done. Next: Read.");
  - an unadopted catalog habit from the pillar the user has the fewest habits in;
  - a short quote (160 characters or fewer).
  
  The titles are translated. Catalog and quote text is English only, as elsewhere in the app.
- **Limits:** pulses are coach messages (ledger kind `coach:pulse`, one row per slot per day). They respect quiet hours and count toward `maxNudgesPerDay`. A pulse is skipped if any coach message went out in the last 30 minutes, so it never lands on top of a check-in. Settings warns when check-ins plus pulses exceed the daily cap.
- `record_coach_nudge` doesn't accept `pulse`: assistants use `other` for their own messages.

## Assistant receipts

When an assistant (an MCP connector, a Custom GPT action, the Claude skill) marks a habit or todo done, every subscribed device gets a receipt: "Claude logged Meditation · 2 of 5 habits done today." with an **Undo** button.

- **Source:** only the `/api/v1` write handlers send receipts, on the change from not done to done: `completions/toggle` (`log_habit`), `completions` POST (`log_habit_value` once the goal is reached), `todos/:id/status` (`set_todo_status`) and `todos/:id` PUT (`update_todo`). The web tracker saves through `/api/storage`, so a tap in the app never sends one. Repeats, unmarking and partial values send nothing.
- **Delivery:** `lib/habits/assistant-receipts.ts` sends the push after the response, so it never slows the assistant's reply (`runAfterResponse` in `lib/habits/after-response.ts`).
- **On by default** for anyone with push set up: `preferences.assistantLogPush`, the switch in Settings → Reminders → "When an assistant logs something". `preferences.notifications` turns it off too.
- **Not limited by quiet hours or the coach cap**, because it answers something the user just asked for. There is a separate cap of 50 a day (ledger kind `log:habit` or `log:todo`, keyed by item and `completedAt`, so re-logging after an Undo sends a new receipt).
- **Each item has its own tag** (`log-habit-<id>-<date>`, `log-todo-<id>`), so several receipts keep their own Undo buttons.
- **Undo:**
  - The button carries a single-use token. `habit_push_actions` stores only its SHA-256, with the exact change to revert. The token expires after 24 hours.
  - The service worker POSTs it to `/api/habits/push/action`. The server puts back the previous state (no completion, the partial value, or the todo's earlier status), but only if the item still has the `completedAt` the assistant set. Anything changed since wins.
  - The receipt is replaced in place with "Undone", or "Couldn't undo". The user's other devices get a silent push with the same tag.
  - Chrome, Edge and Android show the button. Safari (including iPhone PWAs) and Firefox don't support notification buttons; there, a tap opens the tracker.

### Assistants as the coach (MCP)

ChatGPT and Claude automations use these MCP-only tools:
- `get_coach_state`: settings, limits, nudges sent and remaining today, the last nudge of each kind, pending and snoozed suggestions, and per habit `lastLoggedOn`, `unloggedDueDays` and weekly progress.
- `record_coach_nudge({ kind, message })`: call it **before** messaging the user. It applies the same limits and returns `{ allowed, reason }`. Reasons are `quiet_hours`, `daily_limit` or `duplicate`. Only message the user when `allowed` is true.
- `respond_to_suggestion({ suggestion, response, days? })`: accept, dismiss or snooze a coach suggestion.
- `get_reminder_status`: whether reminders are on, devices, last delivery or failure, quiet hours, and what was sent today.

The `coach_checkin` prompt walks a model through this.

## Testing

1. Set the VAPID keys and run a production build (`pnpm build && pnpm start`). The service worker only registers in production, on https or localhost.
2. Sign in, open Settings → Reminders and turn on **Also when Liberture is closed**. The device count should become 1.
3. Press **Send test from server**, from a second device or the phone PWA so the first one can stay closed. Or:
   ```bash
   curl -X POST https://<host>/api/habits/push/test -H "Authorization: Bearer ht_…"   # legacy API-key accounts
   curl -X POST https://<host>/api/habits/push/test -H "Cookie: <your session cookie>"  # Nostr accounts
   ```
4. Set a habit's time to the next minute and close every tab. Within about a minute exactly one notification arrives, and this query shows a single row:
   ```sql
   SELECT * FROM habit_notifications_sent ORDER BY sent_at DESC LIMIT 5;
   ```
5. Open the app on a device without a subscription. The same reminder does not show again.

6. Receipts: with a device subscribed and the app closed, log a habit through an assistant, or directly:
   ```bash
   curl -X POST https://<host>/api/v1/completions/toggle -H "Authorization: Bearer hta_…" -H "Content-Type: application/json" -d '{"habit":"Pushups"}'
   ```
   One receipt with Undo arrives. Tap Undo: the habit is unmarked, open tabs update, and the receipt turns into "Undone". The same curl again (already done) sends nothing.

Unit tests cover the scheduling, claim, limit and rule logic: `pnpm test` (`lib/habits/__tests__/reminders.test.ts`, `assistant-receipts.test.ts`, `push-actions.test.ts`, and `lib/habits/api/__tests__/coach-*.test.ts`, `assistant-receipts-handlers.test.ts`).

## Endpoints

| Route | Auth | What |
|---|---|---|
| `GET /api/habits/push/public-key` | none | VAPID public key; 503 when push isn't configured |
| `POST` / `DELETE /api/habits/push/subscribe` | session (cookie, or `Bearer ht_…`) | Save or remove this device's subscription |
| `GET /api/habits/push/status` | session | Devices, last delivery and failure |
| `POST /api/habits/push/test` | session | Send a push to all your devices now |
| `POST /api/habits/push/claim` | session | Claim a reminder key (the in-tab fallback) |
| `POST /api/habits/push/action` | single-use token from the push (no session) | A notification button: `{ token, action: "undo" }`. 404 unknown or used, 410 expired, rate-limited per IP |
| `GET /api/v1/reminders/status` | assistant token (`read`) | Same status for assistants (`get_reminder_status`) |
