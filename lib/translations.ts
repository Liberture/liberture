export type PillarId = "cognition" | "recovery" | "fueling" | "mental" | "physicality" | "finance"
export type MarketplaceTypeId =
  | "premium"
  | "opensource"
  | "coaching"
  | "books"
  | "video"
  | "interactive"
  | "references"

type PillarTranslation = {
  id: PillarId
  name: string
  description: string
}

type MarketplaceTypeTranslation = {
  id: MarketplaceTypeId
  name: string
  count?: number
}

type LandingFeature = {
  title: string
  description: string
}

type LandingMarketplaceItem = {
  title: string
  pillar: string
  type: string
  author: string
  color: string
  icon: PillarId
}

type LandingKnowledgeCard = {
  title: string
  description: string
  accent: "primary" | "yellow" | "cyan"
}

type Translations = {
  brand: {
    name: string
    abbreviation: string
    tagline: string
  }
  navigation: {
    features: string
    pillars: string
    marketplace: string
    knowledge: string
    howItWorks: string
    dashboard: string
    logout: string
    signIn: string
    getStarted: string
    backHome: string
  }
  common: {
    filters: {
      allDomains: string
      allTypes: string
    }
    pillars: PillarTranslation[]
    marketplaceTypes: MarketplaceTypeTranslation[]
  }
  landing: {
    hero: {
      badge: string
      title: string
      highlight: string
      description: string
      primaryCta: string
      secondaryCta: string
    }
    features: {
      heading: string
      description: string
      items: LandingFeature[]
    }
    pillars: {
      heading: string
      description: string
    }
    marketplace: {
      badge: string
      heading: string
      description: string
      featuredItems: LandingMarketplaceItem[]
      cta: string
    }
    knowledge: {
      heading: string
      description: string
      cards: LandingKnowledgeCard[]
      cta: string
    }
    cta: {
      heading: string
      description: string
      primary: string
    }
    footer: {
      privacy: string
      terms: string
    }
  }
}

export const translations: { en: Translations } = {
  en: {
    brand: {
      name: "Liberture",
      abbreviation: "L",
      tagline: "Your Biological Operating System",
    },
    navigation: {
      features: "Features",
      pillars: "Six Pillars",
      marketplace: "Marketplace",
      knowledge: "Knowledge Base",
      howItWorks: "How It Works",
      dashboard: "Dashboard",
      logout: "Logout",
      signIn: "Sign In",
      getStarted: "Get Started",
      backHome: "Back to home",
    },
    common: {
      filters: {
        allDomains: "All Domains",
        allTypes: "All Types",
      },
      pillars: [
        {
          id: "cognition",
          name: "Cognition",
          description:
            "Optimize focus, memory, learning, and mental clarity through nootropics, brain training, and cognitive protocols.",
        },
        {
          id: "recovery",
          name: "Recovery",
          description:
            "Master sleep, stress management, and regeneration to maximize your body's natural healing and restoration.",
        },
        {
          id: "fueling",
          name: "Fueling",
          description: "Dial in nutrition, hydration, and supplementation for peak energy and metabolic performance.",
        },
        {
          id: "mental",
          name: "Mental State",
          description:
            "Cultivate emotional resilience, mindfulness, and psychological well-being for sustainable performance.",
        },
        {
          id: "physicality",
          name: "Physicality",
          description: "Build strength, endurance, mobility, and physical capacity through optimized training protocols.",
        },
        {
          id: "finance",
          name: "Finance",
          description: "Master wealth creation, financial independence, and resource optimization for life freedom.",
        },
      ],
      marketplaceTypes: [
        { id: "premium", name: "Premium Protocols", count: 47 },
        { id: "opensource", name: "Open Source", count: 124 },
        { id: "coaching", name: "Coaching", count: 32 },
        { id: "books", name: "Books & Guides", count: 89 },
        { id: "video", name: "Video & Media", count: 156 },
        { id: "interactive", name: "Interactive Games", count: 23 },
        { id: "references", name: "References & History" },
      ],
    },
    landing: {
      hero: {
        badge: "Your Biological Operating System",
        title: "Master Your Biology.",
        highlight: "Unlock Your Potential.",
        description:
          "Liberture unifies the fragmented world of human optimization into one intelligent platform. Track, gamify, and optimize every aspect of your biological performance.",
        primaryCta: "Start Optimizing",
        secondaryCta: "Learn More",
      },
      features: {
        heading: "Everything You Need to Optimize",
        description: "Stop juggling multiple apps. Liberture brings all aspects of human optimization under one roof.",
        items: [
          {
            title: "Six Optimization Pillars",
            description: "Cognition, Recovery, Fueling, Mental State, Physicality, and Finance - all unified in one system.",
          },
          {
            title: "Gamified Progress",
            description: "Earn XP, level up your BOS, and complete protocols that turn optimization into an engaging journey.",
          },
          {
            title: "BOS Level Tracking",
            description: "Your Biological Operating System level reflects your overall optimization state across all domains.",
          },
          {
            title: "Smart Protocols",
            description: "AI-curated routines that guide you through proven optimization techniques and habits.",
          },
          {
            title: "Achievement System",
            description: "Unlock achievements, complete quests, and track milestones in your optimization journey.",
          },
          {
            title: "Unified Analytics",
            description: "See how your pillars interact and identify patterns to optimize your performance holistically.",
          },
        ],
      },
      pillars: {
        heading: "The Six Pillars of Optimization",
        description: "Each pillar represents a critical domain of human performance. Balance all six to achieve true optimization.",
      },
      marketplace: {
        badge: "Knowledge Hub",
        heading: "The Liberture Marketplace",
        description:
          "Your central hub for actionable protocols, expert coaching, and educational resources. Curated content aligned with your optimization journey.",
        featuredItems: [
          {
            title: "7-Day Ketogenic Induction Protocol",
            pillar: "Fueling",
            type: "Premium Protocol",
            author: "Dr. Sarah Chen",
            color: "bg-fueling/20 border-fueling/30",
            icon: "fueling",
          },
          {
            title: "Deep Sleep Architecture Masterclass",
            pillar: "Recovery",
            type: "Video Course",
            author: "Prof. Matthew Walker",
            color: "bg-recovery/20 border-recovery/30",
            icon: "recovery",
          },
          {
            title: "Flow State Activation Training",
            pillar: "Cognition",
            type: "Interactive Game",
            author: "Liberture Labs",
            color: "bg-cognition/20 border-cognition/30",
            icon: "cognition",
          },
        ],
        cta: "Explore Full Marketplace",
      },
      knowledge: {
        heading: "Curated Knowledge Library",
        description:
          "Access the definitive educational resource for biohackers. Community-vetted books, research, and expert insights.",
        cards: [
          {
            title: "Document Library",
            description: "Books, e-books, white papers, academic articles, and long-form guides tagged by pillar and topic.",
            accent: "primary",
          },
          {
            title: "The Liberture 100",
            description: "The 100 most influential biohacking books, ranked by community ratings and expert review.",
            accent: "yellow",
          },
          {
            title: "50 Influencers Index",
            description: "The most renowned biohacking authors, researchers, and content creators by domain expertise.",
            accent: "cyan",
          },
        ],
        cta: "Explore Knowledge Base",
      },
      cta: {
        heading: "Ready to Upgrade Your Biology?",
        description:
          "Join thousands of operators who are taking control of their biological performance. Start your optimization journey today.",
        primary: "Get Started Free",
      },
      footer: {
        privacy: "Privacy",
        terms: "Terms",
      },
    },
  },
}
