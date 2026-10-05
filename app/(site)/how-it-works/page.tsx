import { HowItWorks } from "@/components/habits/landing/how-it-works"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getServerOrigin } from "@/lib/habits/request-origin"

export default async function HowItWorksPage() {
  const [locale, origin] = await Promise.all([getRequestLocale(), getServerOrigin()])
  return (
    <main className="relative z-10 min-h-screen pt-6">
      <HowItWorks dict={getDictionary(locale)} origin={origin} />
    </main>
  )
}
