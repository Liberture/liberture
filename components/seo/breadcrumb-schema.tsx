"use client"

import { translatedLabel } from "@/lib/i18n/translated-label"
import Link, { useLocalizedHref } from "@/components/i18n/localized-link"
import { useMessages, useTranslations } from "next-intl"
import { entitySections, parsePublicPath } from "@/lib/i18n/paths"
import { JsonLd } from "./json-ld-script"

// Breadcrumb Schema
export function BreadcrumbSchema({ items: source, compact = false, schemaOnly = false }: { schemaOnly?: boolean; compact?: boolean; items: Array<{ name: string; url: string }> }) {
  const href = useLocalizedHref()
  const t = useTranslations("breadcrumbs")
  const labels = useMessages().breadcrumbs
  const items = source.map(item => {
    const path = new URL(item.url).pathname
    const route = parsePublicPath(path)
    const key = route?.slug || route?.section
    const name = key && (!route?.slug || !entitySections.has(route.section)) ? translatedLabel(labels, key, item.name) : item.name
    return { name, url: new URL(href(path), "https://liberture.com").href }
  })
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  if (schemaOnly) return <JsonLd data={schema} />

  return <><nav aria-label={t("label")} className={compact ? "text-xs text-muted-foreground" : "relative mx-auto w-full max-w-6xl px-4 pt-5 text-xs text-muted-foreground"}>
    <ol className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2"}>{items.map(({name,url},i) => <li key={url} className={compact && i === items.length-1 ? "flex min-w-0 items-center gap-2" : "flex shrink-0 items-center gap-2"}>
      {i > 0 && <span aria-hidden>/</span>}{i === items.length-1 ? <span aria-current="page" className={compact ? "max-w-[30ch] truncate" : undefined} title={compact ? name : undefined}>{name}</span> : <Link className="hover:underline" href={new URL(url).pathname}>{name}</Link>}
    </li>)}</ol>
  </nav><JsonLd data={schema} /></>;
}
