"use client"
import { useTranslations as useUiCopy } from "next-intl"

import { useState, useEffect, Fragment, type ReactNode } from "react"
import { Search, Users, FolderOpen, Building2, Zap, BookOpen, FileText, ArrowRight } from "lucide-react"
import { useLocale } from "next-intl"
import { useSearchParams } from "next/navigation"
import Link from "@/components/i18n/localized-link"
import { PersonCard } from "@/components/people/person-card"
import { BookCard } from "@/components/directory/book-card"
import { OrganizationCard } from "@/components/directory/org-card"
import { ArticleCard } from "@/components/directory/article-card"
import { DirectoryProtocol } from "@/components/directory/protocol-card"
import { useTranslations } from "@/components/i18n/locale-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DirectoryLayout, DirectoryHeader, DirectoryGrid } from "@/components/directory/layout"

type EntityType = "all" | "people" | "projects" | "organizations" | "protocols" | "books" | "articles"

interface DirectoryItem {
  id: string
  name: string
  type: EntityType
  description: string
  slug: string
  tags?: string[]
  card: ReactNode
}

export default function DirectoryPage() {
  const uiCopy = useUiCopy("publicCopy.directory")

  const locale = useLocale()
  const t = useTranslations().habits.app.directoryProfiles
  const params = useSearchParams()
  const searchQuery = params.get("q") || ""
  const requestedType = params.get("type") as EntityType
  const activeFilter = ["people","projects","organizations","protocols","books","articles"].includes(requestedType) ? requestedType : "all"
  function updateFilter(key: string, value: string) {
    const url = new URL(window.location.href)
    if (value && !(key === "type" && value === "all")) url.searchParams.set(key,value)
    else url.searchParams.delete(key)
    window.history.replaceState(null, "", url)
  }
  const [allItems, setAllItems] = useState<DirectoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const featuredLabel = uiCopy("featured")

  // Fetch all directory items
  useEffect(() => {
    const controller = new AbortController()
    const sections = ["people", "projects", "organizations", "protocols", "books", "articles"]
    async function fetchDirectory() {
      setLoading(true)
      try {
        const [peopleRes, projectsRes, orgsRes, protocolsRes, booksRes, articlesRes] = await Promise.all(
          sections.map(async section => {
            const response = await fetch(`/api/${section}?lang=${locale}`, { signal: controller.signal })
            if (!response.ok) throw new Error(`Directory request failed for ${section}: ${response.status}`)
            return response.json()
          }),
        )
        if (controller.signal.aborted) return

        const items: DirectoryItem[] = [
          ...(peopleRes.people || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: "people" as EntityType,
            card: <PersonCard person={p} featuredLabel={featuredLabel} />,
            description: p.bio || p.description || "",
            slug: p.slug,
            tags: p.pillars ? p.pillars.split(',').map((s: string) => s.trim()) : [],
          })),
          ...[...(projectsRes.projects || []), ...(orgsRes.organizations || [])].map((o: any) => ({
            id: o.id,
            name: o.name,
            type: (o.directoryKind === "project" ? "projects" : "organizations") as EntityType,
            card: <OrganizationCard org={o} />,
            description: o.description || "",
            slug: o.slug,
            tags: o.pillars ? o.pillars.split(',').map((s: string) => s.trim()) : [],
          })),
          ...(protocolsRes.protocols || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: "protocols" as EntityType,
            card: <DirectoryProtocol protocol={p} />,
            description: p.description || "",
            slug: p.slug,
            tags: [p.pillar].filter(Boolean),
          })),
          ...(booksRes.books || []).map((b: any) => ({
            id: b.id,
            name: b.title,
            type: "books" as EntityType,
            card: <BookCard book={b} />,
            description: b.description || "",
            slug: b.slug,
            tags: b.pillars ? b.pillars.split(',').map((s: string) => s.trim()) : [],
          })),
          ...(articlesRes.articles || []).map((a: any) => ({
            id: a.id,
            name: a.title,
            type: "articles" as EntityType,
            card: <ArticleCard article={{ ...a, tags: Array.isArray(a.tags) ? a.tags.join(",") : a.tags }} />,
            description: a.description || "",
            slug: a.slug,
            tags: Array.isArray(a.tags) ? a.tags : [a.pillar].filter(Boolean),
          })),
        ]

        setAllItems(items)
        setLoading(false)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Error fetching directory:", error)
        setLoading(false)
      }
    }

    void fetchDirectory()
    return () => controller.abort()
  }, [locale, featuredLabel])

  // Filter items based on search only (for counts)
  const searchFilteredItems = allItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Calculate counts based on search only (not affected by type filter)
  const counts = {
    all: searchFilteredItems.length,
    people: searchFilteredItems.filter((i) => i.type === "people").length,
    projects: searchFilteredItems.filter(i => i.type === "projects").length,
    organizations: searchFilteredItems.filter((i) => i.type === "organizations").length,
    protocols: searchFilteredItems.filter((i) => i.type === "protocols").length,
    books: searchFilteredItems.filter((i) => i.type === "books").length,
    articles: searchFilteredItems.filter((i) => i.type === "articles").length,
  }

  // Filter items based on search AND type
  const filteredItems = searchFilteredItems.filter((item) => {
    const matchesType = activeFilter === "all" || item.type === activeFilter
    return matchesType
  })

  // Group filtered items by type (for display)
  const groupedItems = {
    people: filteredItems.filter((i) => i.type === "people"),
    projects: filteredItems.filter(i => i.type === "projects"),
    organizations: filteredItems.filter((i) => i.type === "organizations"),
    protocols: filteredItems.filter((i) => i.type === "protocols"),
    books: filteredItems.filter((i) => i.type === "books"),
    articles: filteredItems.filter((i) => i.type === "articles"),
  }

  const filters: Array<{ value: EntityType; label: string; icon: any; color: string }> = [
    { value: "all", label: uiCopy("all"), icon: Search, color: "text-slate-400" },
    { value: "people", label: uiCopy("people"), icon: Users, color: "text-purple-400" },
    { value: "projects", label: t.projects, icon: FolderOpen, color: "text-cyan-400" },
    { value: "organizations", label: uiCopy("organizations"), icon: Building2, color: "text-cyan-400" },
    { value: "protocols", label: uiCopy("protocols"), icon: Zap, color: "text-green-400" },
    { value: "books", label: uiCopy("books"), icon: BookOpen, color: "text-orange-400" },
    { value: "articles", label: uiCopy("articles"), icon: FileText, color: "text-blue-400" },
  ]

  return (
    <DirectoryLayout>
        <DirectoryHeader title={uiCopy("biohackingDirectory")} description={t.directoryIntro} />
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={uiCopy("searchByNameDescriptionOrTags")}
              value={searchQuery}
              onChange={(e) => updateFilter("q", e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
          {filters.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFilter === filter.value
            return (
              <Button
                key={filter.value}
                aria-pressed={isActive}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter("type", filter.value)}
                className="gap-2"
              >
                <Icon className={`h-4 w-4 ${isActive ? "" : filter.color}`} />
                {filter.label}
                <span className="text-xs opacity-70">
                  ({counts[filter.value]})
                </span>
              </Button>
            )
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">{uiCopy("loadingDirectory")}</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{uiCopy("noResultsFound")}</h3>
                <p className="text-muted-foreground">{uiCopy("tryAdjustingYourSearchOrFilters")}</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* People Section */}
                {(activeFilter === "all" || activeFilter === "people") && groupedItems.people.length > 0 && (
                  <DirectorySection
                    title={uiCopy("people")}
                    icon={Users}
                    color="purple"
                    items={groupedItems.people}
                    baseUrl="/people"
                    showAll={activeFilter !== "people"}
                  />
                )}

                {groupedItems.projects.length > 0 && <DirectorySection title={t.projects} icon={FolderOpen} color="cyan" items={groupedItems.projects} baseUrl="/projects" showAll={activeFilter !== "projects"} />}
                {/* Organizations Section */}
                {(activeFilter === "all" || activeFilter === "organizations") &&
                  groupedItems.organizations.length > 0 && (
                    <DirectorySection
                      title={uiCopy("organizations")}
                      icon={Building2}
                      color="cyan"
                      items={groupedItems.organizations}
                      baseUrl="/organizations"
                      showAll={activeFilter !== "organizations"}
                    />
                  )}

                {/* Protocols Section */}
                {(activeFilter === "all" || activeFilter === "protocols") &&
                  groupedItems.protocols.length > 0 && (
                    <DirectorySection
                      title={uiCopy("protocols")}
                      icon={Zap}
                      color="green"
                      items={groupedItems.protocols}
                      baseUrl="/protocols"
                      showAll={activeFilter !== "protocols"}
                    />
                  )}

                {/* Books Section */}
                {(activeFilter === "all" || activeFilter === "books") && groupedItems.books.length > 0 && (
                  <DirectorySection
                    title={uiCopy("books")}
                    icon={BookOpen}
                    color="orange"
                    items={groupedItems.books}
                    baseUrl="/books"
                    showAll={activeFilter !== "books"}
                  />
                )}

                {/* Articles Section */}
                {(activeFilter === "all" || activeFilter === "articles") && groupedItems.articles.length > 0 && (
                  <DirectorySection
                    title={uiCopy("articles")}
                    icon={FileText}
                    color="blue"
                    items={groupedItems.articles}
                    baseUrl="/articles"
                    showAll={activeFilter !== "articles"}
                  />
                )}
              </div>
            )}
          </>
        )}
    </DirectoryLayout>
  )
}

interface DirectorySectionProps {
  title: string
  icon: any
  color: string
  items: DirectoryItem[]
  baseUrl: string
  showAll: boolean
}

function DirectorySection({ title, icon: Icon, color, items, baseUrl, showAll }: DirectorySectionProps) {
  const uiCopy = useUiCopy("publicCopy.directory")

  const colorClasses = {
    purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    green: "text-green-400 border-green-500/30 bg-green-500/10",
    orange: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  }

  const displayItems = showAll ? items.slice(0, 6) : items

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <span className="text-sm text-muted-foreground">({items.length})</span>
        </div>
        {showAll && items.length > 6 && (
          <Link href={baseUrl}>
            <Button variant="ghost" size="sm" className="gap-2">{uiCopy("viewAll")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Items Grid */}
      <DirectoryGrid>
        {displayItems.map(item => <Fragment key={item.id}>{item.card}</Fragment>)}
      </DirectoryGrid>
    </div>
  )
}
