import { LandingHero } from "@/components/habits/landing-hero"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getServerOrigin } from "@/lib/habits/request-origin"

export default async function Home() {
  const [locale, origin] = await Promise.all([getRequestLocale(), getServerOrigin()])
  return (
    <div className="min-h-screen">
      <LandingHero locale={locale} origin={origin} />
    </div>
  )
}
