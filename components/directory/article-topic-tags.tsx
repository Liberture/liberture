import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { Badge } from "@/components/ui/badge"
import { profilePillars } from "@/lib/pillars"

export function ArticleTopicTags({ topics }: { topics: string[] }) {
  const seen = new Set<string>()
  return topics.map(topic => {
    const [pillar] = profilePillars(topic)
    const key = pillar ?? topic.trim().toLowerCase()
    if (!key || seen.has(key)) return null
    seen.add(key)
    return pillar ? <PillarTag key={key} pillar={pillar} /> : <Badge key={key} variant="secondary">{topic}</Badge>
  })
}
