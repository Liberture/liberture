"use client"
import { usePathname } from "next/navigation"
import { parsePublicPath } from "@/lib/i18n/paths"
import { SectionBreadcrumbs } from "./section-breadcrumbs"

export function SiteBreadcrumbs() {
  return <SectionBreadcrumbs pathname={parsePublicPath(usePathname())?.internalPath ?? "/"} />
}
