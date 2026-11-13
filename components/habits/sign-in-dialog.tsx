"use client"

import { LoginModal, useLogout } from "@nostr-wot/ui"
import type { Event, EventTemplate } from "nostr-tools"
import { useTranslations } from "@/components/i18n/locale-provider"
import { buildAuthEvent } from "@/lib/habits/nostr/auth-event"
import { NOSTRCONNECT_RELAYS } from "@/lib/habits/nostr/remote-signer"

type SignInStrings = ReturnType<typeof useTranslations>["habits"]["app"]["signInDialog"]

// AuthType / AuthResult are kept compatible with the existing app/page.tsx
// restore logic. We emit Nostr results from this screen; "nsec" covers both
// signing in with a pasted secret key and creating a brand-new key.
export type AuthType = "api-key" | "nip07" | "nip46" | "nsec"

export interface AuthResult {
  type: AuthType
  apiKey?: string
  pubkey?: string
  npub?: string
}

interface SignInDialogProps {
  open: boolean
  onClose: () => void
  onAuthenticated: (result: AuthResult) => void
}

interface ChallengeSigner {
  signEvent(template: EventTemplate): Promise<Event>
}

/**
 * Sign the server's challenge and post it. On success the server sets the
 * httpOnly session cookie; nothing secret comes back to this page.
 */
async function performChallengeAuth(
  signer: ChallengeSigner,
  pubkey: string,
  t: SignInStrings
): Promise<void> {
  const challengeRes = await fetch(
    `/api/auth/nostr/challenge?pubkey=${encodeURIComponent(pubkey)}`
  )
  if (challengeRes.status === 429) throw new Error(t.errorRateLimited)
  if (!challengeRes.ok) {
    const err = await challengeRes
      .json()
      .catch(() => ({ error: t.errorChallengeRequest }))
    throw new Error(err.error || t.errorChallengeRequest)
  }
  const { challenge } = await challengeRes.json()
  if (!challenge) throw new Error(t.errorNoChallenge)

  const signedEvent = await signer.signEvent(buildAuthEvent(challenge, "/api/auth/nostr"))

  const authRes = await fetch("/api/auth/nostr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubkey, signedEvent }),
  })
  if (authRes.status === 429) throw new Error(t.errorRateLimited)
  if (!authRes.ok) {
    const err = await authRes
      .json()
      .catch(() => ({ error: t.errorAuthFailed }))
    throw new Error(err.error || t.errorAuthFailed)
  }
}

export function SignInDialog({ open, onClose, onAuthenticated }: SignInDialogProps) {
  const t = useTranslations().habits.app.signInDialog
  const logoutSigner = useLogout()
  return (
    <LoginModal
      open={open}
      onClose={onClose}
      title={t.title}
      subtitle={t.subtitleSelect}
      nip46Relays={NOSTRCONNECT_RELAYS}
      nip46Metadata={{ name: "Liberture", url: window.location.origin }}
      nip46Connection={{ labels: {
        openSigner: t.openSignerApp,
        pasteUri: t.promptBunker,
        copyUri: t.copyUri,
        copied: t.copiedUri,
        fallbackHint: t.connectHint,
      } }}
      showRememberToggle={false}
      nip46Perms="sign_event:27235"
      onLogin={async ({ signer, pubkey, method }) => {
        try {
          await performChallengeAuth(signer, pubkey, t)
        } catch (error) {
          await logoutSigner()
          throw error
        }
        onAuthenticated({ type: method === "import" || method === "generate" ? "nsec" : method, pubkey })
      }}
    />
  )
}
