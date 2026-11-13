import { redirect } from 'next/navigation'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { LandingFooter } from "@/components/layout/landing-footer"
import { LandingNav } from "@/components/layout/landing-nav"
import { AnimatedBackground } from "@/components/illustrations/AnimatedBackground"

import { managedAuthEnabled } from "@/lib/identity/config"
import { AdminNavigation } from "./admin-navigation"

export const metadata = { robots: { index: false, follow: false } }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getAuthUser()

  if (!authUser) {
    redirect('/login?redirect=/admin')
  }

  const admin = await isAdmin(authUser.userId)
  if (!admin) {
    redirect('/')
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col">
      <AnimatedBackground />
      <LandingNav />
      <div className="relative mx-auto grid w-full max-w-screen-2xl flex-1 content-start gap-4 px-4 pb-10 pt-20 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-7 lg:px-8 lg:pt-24">
        <AdminNavigation managed={managedAuthEnabled()} />
        <main className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">{children}</main>
      </div>
      <LandingFooter locale={await getRequestLocale()} />
    </div>
  )
}
