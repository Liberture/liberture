import type { Metadata } from "next"
import Link from "next/link"

import { LegalPage } from "@/components/habits/site/legal-page"
import { getSiteSetting } from "@/lib/habits/oauth/store"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"

export const metadata: Metadata = { title: "Support · Liberture" }

export default async function SupportPage() {
  const [email, locale] = await Promise.all([getSiteSetting("contact_email").catch(() => null), getRequestLocale()])
  const dict = getDictionary(locale)
  return (
    <LegalPage locale={locale} dict={dict} title="Support">
      <p>
        {email ? (
          <>
            Write to <a href={`mailto:${email}`}>{email}</a>. We usually answer within two working days.
          </>
        ) : (
          <>Contact details are being set up. In the meantime, the guide below covers setup and common problems.</>
        )}
      </p>

      <h2>Setting up</h2>
      <ul>
        <li><Link href="/docs">Overview</Link>: what your assistant can do.</li>
        <li><Link href="/docs/claude">Connect Claude</Link> and <Link href="/docs/chatgpt">connect ChatGPT</Link>.</li>
        <li><Link href="/docs/permissions">Permissions</Link>: what each switch allows.</li>
      </ul>

      <h2>Common problems</h2>
      <ul>
        <li><strong>The assistant asks me to sign in again.</strong> It was disconnected in Settings, or you used a different account. Connect it again and approve.</li>
        <li><strong>It says an action is switched off.</strong> Turn it back on in Settings → Voice assistants.</li>
        <li><strong>It can&apos;t find a habit.</strong> Say the name as it appears in the app, or ask it to create the habit.</li>
        <li><strong>I want to delete my data.</strong> Use Settings → Clear all data, or write to us to delete the account.</li>
      </ul>
    </LegalPage>
  )
}
