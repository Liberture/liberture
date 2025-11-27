import { KnowledgeBaseContent } from "@/components/knowledge-base-content"
import { LandingNav } from "@/components/landing-nav"

export default function KnowledgePage() {
  return (
    <div className="min-h-screen topo-pattern">
      <LandingNav />
      <div className="pt-16">
        <KnowledgeBaseContent />
      </div>
    </div>
  )
}
