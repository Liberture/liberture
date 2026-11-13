import { HowItWorks } from "@/components/habits/landing/how-it-works"
import { getSiteMessages } from "@/lib/i18n/messages.server"
import { getLocale } from "next-intl/server"
import { getServerOrigin } from "@/lib/habits/request-origin"

export default async function HowItWorksPage() {
  const [locale, origin] = await Promise.all([getLocale(), getServerOrigin()])
  return (
    <main className="relative z-10 min-h-screen pt-6">
      <HowItWorks dict={(await getSiteMessages()).habits} origin={origin} />
    </main>
  )
}
