import Link from "@/components/i18n/localized-link"
import { ProtocolCard } from "@/components/habits/marketplace/protocol-card"
import { catalogProtocols } from "@/lib/habits/protocols/localized-catalog"
import { useLocale } from "next-intl"

export function DirectoryProtocol({ protocol }: { protocol: { slug: string; name: string; description: string } }) {
  const catalog = catalogProtocols(useLocale()).find(entry => entry.slug === protocol.slug)
  const href = `/protocols/${protocol.slug}`
  if (catalog) return <ProtocolCard protocol={catalog} adopted={false} href={href} />
  return <Link href={href} className="rounded-xl border border-border bg-card p-5 hover:border-primary">
    <h3 className="text-lg font-bold">{protocol.name}</h3>
    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{protocol.description}</p>
  </Link>
}
