"use client"

import { useState, useEffect } from "react"
import { Search, Users, Building2, Zap, BookOpen, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TriadBasins, VortexShell } from "@/components/patterns"

type EntityType = "all" | "people" | "organizations" | "protocols" | "books" | "articles"

interface DirectoryItem {
  id: string
  name: string
  type: EntityType
  description: string
  slug: string
  tags?: string[]
}

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<EntityType>("all")
  const [allItems, setAllItems] = useState<DirectoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all directory items
  useEffect(() => {
    async function fetchDirectory() {
      try {
        const [peopleRes, orgsRes, protocolsRes, booksRes, articlesRes] = await Promise.all([
          fetch("/api/people").then((r) => r.json()),
          fetch("/api/organizations").then((r) => r.json()),
          fetch("/api/protocols").then((r) => r.json()),
          fetch("/api/books").then((r) => r.json()),
          fetch("/api/articles").then((r) => r.json()),
        ])

        const items: DirectoryItem[] = [
          ...(peopleRes.people || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: "people" as EntityType,
            description: p.bio || p.description || "",
            slug: p.slug,
            tags: p.pillars ? p.pillars.split(',').map((s: string) => s.trim()) : [],
          })),
          ...(orgsRes.organizations || []).map((o: any) => ({
            id: o.id,
            name: o.name,
            type: "organizations" as EntityType,
            description: o.description || "",
            slug: o.slug,
            tags: o.pillars ? o.pillars.split(',').map((s: string) => s.trim()) : [],
          })),
          ...(protocolsRes.protocols || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            type: "protocols" as EntityType,
            description: p.description || "",
            slug: p.slug,
            tags: [p.pillar].filter(Boolean),
          })),
          ...(booksRes.books || []).map((b: any) => ({
            id: b.id,
            name: b.title,
            type: "books" as EntityType,
            description: b.description || "",
            slug: b.slug,
            tags: b.pillars ? b.pillars.split(',').map((s: string) => s.trim()) : [],
          })),
          ...(articlesRes.articles || []).map((a: any) => ({
            id: a.id,
            name: a.title,
            type: "articles" as EntityType,
            description: a.description || "",
            slug: a.slug,
            tags: Array.isArray(a.tags) ? a.tags : [a.pillar].filter(Boolean),
          })),
        ]

        setAllItems(items)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching directory:", error)
        setLoading(false)
      }
    }

    fetchDirectory()
  }, [])

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
    organizations: filteredItems.filter((i) => i.type === "organizations"),
    protocols: filteredItems.filter((i) => i.type === "protocols"),
    books: filteredItems.filter((i) => i.type === "books"),
    articles: filteredItems.filter((i) => i.type === "articles"),
  }

  const filters: Array<{ value: EntityType; label: string; icon: any; color: string }> = [
    { value: "all", label: "All", icon: Search, color: "text-slate-400" },
    { value: "people", label: "People", icon: Users, color: "text-purple-400" },
    { value: "organizations", label: "Organizations", icon: Building2, color: "text-cyan-400" },
    { value: "protocols", label: "Protocols", icon: Zap, color: "text-green-400" },
    { value: "books", label: "Books", icon: BookOpen, color: "text-orange-400" },
    { value: "articles", label: "Articles", icon: FileText, color: "text-blue-400" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden py-20 px-4">
      <VortexShell
        placement="corner"
        gradient="plasma"
        size="500px"
        className="-right-20 -top-20"
        opacity={0.15}
      />
      <TriadBasins
        placement="corner"
        gradient="acidLime"
        size="380px"
        className="-left-24 top-1/2"
        opacity={0.1}
      />

      <div className="container relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Biohacking Directory
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the people, organizations, protocols, and knowledge shaping human optimization.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.value)}
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
            <p className="mt-4 text-muted-foreground">Loading directory...</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* People Section */}
                {(activeFilter === "all" || activeFilter === "people") && groupedItems.people.length > 0 && (
                  <DirectorySection
                    title="People"
                    icon={Users}
                    color="purple"
                    items={groupedItems.people}
                    baseUrl="/people"
                    showAll={activeFilter !== "people"}
                  />
                )}

                {/* Organizations Section */}
                {(activeFilter === "all" || activeFilter === "organizations") &&
                  groupedItems.organizations.length > 0 && (
                    <DirectorySection
                      title="Organizations"
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
                      title="Protocols"
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
                    title="Books"
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
                    title="Articles"
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
      </div>
    </div>
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
            <Button variant="ghost" size="sm" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`${baseUrl}/${item.slug}`}>
              <div className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-all hover:scale-105">
                <h3 className="font-semibold mb-1 line-clamp-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
