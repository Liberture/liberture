import Link from "next/link"
import { BookOpen, Users, Zap, Building2, FileText, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { IconCardGrid } from "./icon-card-grid"
import { LandingSection, LandingSectionHeader } from "./landing-section"

const directoryItems = [
  {
    title: "People",
    description: "Discover the leading experts, researchers, and practitioners in human optimization.",
    icon: Users,
    iconClassName: "text-purple-400",
    cardClassName: "hover:border-purple-500/50",
  },
  {
    title: "Books",
    description: "The most influential books on biohacking, longevity, and performance.",
    icon: BookOpen,
    iconClassName: "text-orange-400",
    cardClassName: "hover:border-orange-500/50",
  },
  {
    title: "Protocols",
    description: "Evidence-based protocols for sleep, nutrition, exercise, and mental performance.",
    icon: Zap,
    iconClassName: "text-green-400",
    cardClassName: "hover:border-green-500/50",
  },
  {
    title: "Organizations",
    description: "Research institutes, companies, and projects advancing human optimization.",
    icon: Building2,
    iconClassName: "text-cyan-400",
    cardClassName: "hover:border-cyan-400/50",
  },
  {
    title: "Articles",
    description: "Research articles, white papers, and guides on the science of human performance.",
    icon: FileText,
    iconClassName: "text-blue-400",
    cardClassName: "hover:border-blue-500/50",
  },
]

export function LandingKnowledge() {
  return (
    <LandingSection>
      <LandingSectionHeader
        heading="The Biohacking Directory"
        description="A comprehensive, searchable index of the people, books, protocols, organizations, and research shaping human optimization."
      />

      <IconCardGrid
        items={directoryItems}
        gridClassName="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10"
        defaultCardClassName="bg-card/50 border border-border/50"
      />

      <div className="text-center">
        <Link href="/directory">
          <Button size="lg" className="gap-2">
            Explore the Directory
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </LandingSection>
  )
}
