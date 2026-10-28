# Liberture push notifications: status and what's left
Date: 27 October 2026.

## Status
- **Shipped:** PR #48 (merge commit `d184f19`), deployed to liberture.com on 27 Oct 2026.
- **Feature 1:** a notification with an **Undo** button when an assistant (ChatGPT, Claude, …) marks a habit or todo done. It goes to every subscribed device and is on by default.
- **Feature 2:** "Random check-ins" during the day (a suggestion, progress, a catalog idea or a quote). Off by default; set 0–3 per day in Settings → Preferences → Coach.

## Update, 27 Oct 2026: fixed, steps 1–4 done
- **Step 1:** VAPID keys generated and stored as the repo secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT`.
- **Steps 2–3 (Option B):** PR #49 (`073ebfb`) makes the deploy append them to `.env`. Deployed successfully.
- **Step 4:** `/api/habits/push/public-key` returns 200, and its key matches `~/vapid.env`. `get_reminder_status` shows `pushConfigured: true`.
- **Still to do:**
  - Step 5: turn it on for each device (`devices` is 0 for now).
  - Step 6: test.
  - Back up `~/vapid.env` in a password manager, then delete it.

## Problem: notifications only show on the device you're using
**Cause: production has no Web Push (VAPID) keys, so the server can't send a push to any device.** Only an open Liberture tab can show a notification, and only on that device.

Evidence (27 Oct 2026):

| Check | Result |
|---|---|
| `curl https://liberture.com/api/habits/push/public-key` | `503 {"code":"push_not_configured"}` |
| `get_reminder_status` (Liberture connector) | `pushConfigured: false`, `devices: 0` |
| `gh secret list` | Only `ENV_PRODUCTION`, `SSH_HOST`, `SSH_PRIVATE_KEY`, `SSH_USER`. No VAPID keys |
| `ENV_PRODUCTION` last updated | 2026-02-26, before push existed |

This means pushes to closed devices have **never** worked in production. That covers habit reminders and coach check-ins too, not just the new features. The deploy writes production's `.env` entirely from the `ENV_PRODUCTION` secret (`.github/workflows/deploy.yml`, step "Write .env from secret").

The two test buttons in Settings → Reminders also do different things:
- **Send test** (first card) shows a notification only on the device you press it on, by design.
- **Send test from server** goes to every subscribed device. This is the one to use.

## What's left to make it work

### 1. Generate the VAPID key pair (once, and keep it)
```bash
node scripts/generate-vapid-keys.mjs
```
It prints three lines: `VAPID_PUBLIC_KEY=…`, `VAPID_PRIVATE_KEY=…`, `VAPID_SUBJECT=mailto:hello@liberture.com`.

- **Keep these keys forever.** Changing them later cuts off every device that subscribed, and each device would have to turn notifications on again.
- The private key is a secret. Don't commit it or paste it into chats.

### 2. Put the keys into production (pick one)

**Option A: edit `ENV_PRODUCTION` (no code change)**
1. GitHub → Liberture/liberture → Settings → Secrets and variables → Actions → `ENV_PRODUCTION` → Update.
2. GitHub won't show the current value, so paste the **full** existing `.env` content plus the three VAPID lines at the end. Saving only the VAPID lines would wipe `DATABASE_URL` and everything else.

**Option B: three separate secrets (doesn't touch `ENV_PRODUCTION`)**
1. Generate the keys and add all three repo secrets in one go. Nothing is printed, and the file stays outside the repo:
   ```bash
   cd /root/liberture
   node scripts/generate-vapid-keys.mjs > ~/vapid.env
   gh secret set -f ~/vapid.env      # creates VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
   gh secret list                    # the three names should appear
   ```
   Copy `~/vapid.env` into your password manager as a backup, then delete it (`rm ~/vapid.env`). This replaces step 1 above.
2. Change the "Write .env from secret" step in `.github/workflows/deploy.yml` to:
   ```yaml
   - name: Write .env from secret
     run: |
       echo "${{ secrets.ENV_PRODUCTION }}" > .env
       echo "VAPID_PUBLIC_KEY=${{ secrets.VAPID_PUBLIC_KEY }}" >> .env
       echo "VAPID_PRIVATE_KEY=${{ secrets.VAPID_PRIVATE_KEY }}" >> .env
       echo "VAPID_SUBJECT=${{ secrets.VAPID_SUBJECT }}" >> .env
   ```
3. Merge that change to `master`. The merge also redeploys, so step 3 isn't needed.

### 3. Redeploy
The deploy only runs on a push to `master` (there is no manual trigger). After Option A, re-run the last deploy; a re-run reads the current secrets:
```bash
gh run rerun 40445790070
```
You can also use GitHub → Actions → "Deploy to Prod" → Re-run all jobs.

### 4. Check the server
- `curl https://liberture.com/api/habits/push/public-key` returns **200** with `{"publicKey":"…"}` (not 503).
- On the server, `pm2 logs liberture` shows `[reminders] scheduler started (every 60s)`.
- Asking an assistant "what's my reminder status?" (`get_reminder_status`) shows `pushConfigured: true`.

### 5. Turn it on for **each** device
Every device has to subscribe on its own; until then `devices` stays at 0.

- **Android / desktop (Chrome, Edge, Firefox):**
  1. Open liberture.com, sign in with the same account and open Settings → Reminders.
  2. Allow notifications, then turn on **"Also when Liberture is closed"**.
  3. On desktop the browser must be running, even with no tab open, for pushes to arrive.
- **iPhone / iPad (iOS 16.4+):**
  1. In Safari, tap Share → **Add to Home Screen**.
  2. Open Liberture **from that icon**, not from Safari.
  3. Go to Settings → Reminders, allow notifications, and turn on "Also when Liberture is closed".
  4. A subscription made in a regular Safari tab doesn't work.
- After each device, the "Devices" line in Settings → Reminders should go up by one.
- **Every device must use the same account.** A phone signed in with a different login gets its own, separate notifications.

### 6. Test
1. Settings → Reminders → **Send test from server**. Every subscribed device should get it within seconds, even with Liberture closed.
2. Ask Claude or ChatGPT to log a habit. Every device should get "Claude logged … · X of Y habits done today" with **Undo**.
3. Tap Undo on one device. The habit is unmarked, and the notification on the other devices changes to "Undone".
   - The Undo button shows on Chrome, Edge and Android.
   - On iPhone, Safari and Firefox there is no button; tapping the notification opens the tracker.
4. Optional: set Settings → Preferences → Coach → **Random check-ins** to 1–3 a day.

## Still untested
- A real device receiving these notifications and tapping Undo. It can't be tested until steps 1–5 are done.
- `pnpm lint`: ESLint isn't installed in the repo, so it doesn't run.

## Reference
- Full documentation: `docs/REMINDERS.md` (setup, how it works, endpoints, testing).
- Key files:
  - `lib/habits/push.ts`: sending pushes.
  - `lib/habits/assistant-receipts.ts`: the assistant notifications.
  - `lib/habits/push-actions.ts` and `app/api/habits/push/action/route.ts`: Undo.
  - `lib/habits/coach/pulses.ts` and `pulse-rules.ts`: random check-ins.
  - `public/sw.js`: the service worker.
