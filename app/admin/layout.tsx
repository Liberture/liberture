import { redirect } from 'next/navigation'
import { getAuthUser, isAdmin } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authUser = await getAuthUser()

  if (!authUser) {
    redirect('/admin-login?redirect=/admin')
  }

  const admin = await isAdmin(authUser.userId)
  if (!admin) {
    // Not an admin — redirect home, not back to login
    redirect('/')
  }

  return <>{children}</>
}
