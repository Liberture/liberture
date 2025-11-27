import { KnowledgeBaseContent } from "@/components/knowledge-base-content"
import { LandingNav } from "@/components/landing-nav"
import { TopographicBackground } from "@/components/topographic-background"

export default function KnowledgePage() {
  return (
    <div className="min-h-screen topo-pattern">
      <TopographicBackground />
      <LandingNav />
      <div className="pt-16">
        <KnowledgeBaseContent />
      </div>
    </div>
  )
}
