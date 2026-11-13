"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, Mail, MessagesSquare, Share2, Store, Users } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { FieldOption, FieldSelect } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const sections = [
  { key: "directory", icon: BookOpen },
  { key: "users", icon: Users },
  { key: "subscribers", icon: Mail },
  { key: "marketplace", icon: Store },
  { key: "social", icon: Share2 },
  { key: "comments", icon: MessagesSquare },
] as const

export function AdminNavigation({ managed }: { managed: boolean }) {
  const t = useTranslations().habits.app.adminNav
  const pathname = usePathname()
  const router = useRouter()
  const links = sections.filter(({ key }) => key !== "users" || managed)
  const section = pathname.split("/")[2] || "directory"
  const selected = links.find(({ key }) => key === section)
  return (
    <nav aria-label={t.title} className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-24 lg:self-start lg:p-4">
      <p className="mb-3 hidden px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">{t.title}</p>
      <div className="hidden space-y-1 lg:block">
        {links.map(({ key, icon: Icon }) => (
          <Button key={key} asChild variant="ghost" className={cn("w-full justify-start text-muted-foreground", key === section && "bg-primary/15 font-semibold text-primary")}>
            <Link href={`/admin/${key}`} aria-current={section === key ? "page" : undefined}>
              <Icon aria-hidden="true" />{t[key]}
            </Link>
          </Button>
        ))}
      </div>
      <div className="lg:hidden">
        <FieldSelect aria-label={t.title} value={section} displayValue={selected && t[selected.key]} onValueChange={value => router.push(`/admin/${value}`)}>
          {links.map(({ key }) => <FieldOption key={key} value={key}>{t[key]}</FieldOption>)}
        </FieldSelect>
      </div>
    </nav>
  )
}
