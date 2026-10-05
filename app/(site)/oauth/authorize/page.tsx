import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { ConsentScreen } from "@/components/habits/oauth/consent-screen"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { checkAuthorizeRequest } from "@/lib/habits/oauth/authorize"
import { redirectHost } from "@/lib/habits/oauth/pkce"

export const metadata: Metadata = {
  title: "Connect · Liberture",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

interface AuthorizePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * /oauth/authorize — where Claude or ChatGPT sends the user when they add the
 * connector. Validated here; signing in and approving happen in the client
 * component, against the same session the app uses.
 */
export default async function AuthorizePage({ searchParams }: AuthorizePageProps) {
  const raw = await searchParams
  const one = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : null)
  const params = {
    response_type: one("response_type"),
    client_id: one("client_id"),
    redirect_uri: one("redirect_uri"),
    code_challenge: one("code_challenge"),
    code_challenge_method: one("code_challenge_method"),
    state: one("state"),
    scope: one("scope"),
  }
  const [locale, check] = await Promise.all([getRequestLocale(), checkAuthorizeRequest(params)])
  const dict = getDictionary(locale)

  if (!check.ok && check.redirect) redirect(check.redirect)

  return (
    <div className="topo-pattern lb-see-through">
      <main className="relative z-10 mx-auto max-w-md px-4 py-10 sm:py-16">
        {check.ok ? (
          <ConsentScreen
            params={{ ...params, redirect_uri: check.redirectUri }}
            appName={check.client.name}
            host={redirectHost(check.redirectUri)}
            t={dict.oauth}
          />
        ) : (
          <div className="rounded-2xl border border-exercise/30 bg-exercise/10 p-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-exercise" aria-hidden />
            <h1 className="mt-3 text-xl font-bold text-foreground">{dict.oauth.errorTitle}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{check.message}</p>
          </div>
        )}
      </main>
    </div>
  )
}
