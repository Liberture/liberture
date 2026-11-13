import { getSiteMessages } from "@/lib/i18n/messages.server"
import Panel from "../comments-admin"

export default async function Page() {
  const t = (await getSiteMessages()).habits.app.adminNav
  return <section className="space-y-5"><h1 className="text-2xl font-semibold">{t.comments}</h1><Panel /></section>
}
