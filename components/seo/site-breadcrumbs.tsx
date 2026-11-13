"use client"
import { usePathname } from "next/navigation"
import { SectionBreadcrumbs } from "./section-breadcrumbs"

export function SiteBreadcrumbs() {
  return <SectionBreadcrumbs pathname={usePathname()} />
}
