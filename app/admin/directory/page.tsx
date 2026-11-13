import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getDictionary } from "@/lib/habits/i18n"
import Panel from "../directory-admin"

export default async function Page() {
  const t = getDictionary(await getRequestLocale()).app.adminNav
  return <section className="space-y-5"><h1 className="text-2xl font-semibold">{t.directory}</h1><Panel /></section>
}
