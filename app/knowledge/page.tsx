import { LandingNav } from "@/components/landing-nav"
import { TopographicBackground } from "@/components/topographic-background"
import { KnowledgeBaseContent } from "./knowledge-base-content"

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
