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

type MarketplaceTranslations = {
  heading: string
  description: string
  searchPlaceholder: string
  filters: {
    pillarLabel: string
    contentTypeLabel: string
    resultsCount: string
    typeOverrides?: Partial<Record<MarketplaceTypeId, string>>
  }
  price: {
    free: string
  }
  meta: {
    byPrefix: string
  }
  emptyState: {
    message: string
    reset: string
  }
  recommendation: {
    title: string
    description: string
    cta: string
  }
}

type KnowledgeTranslations = {
  hero: {
    badge: string
    title: string
    subtitle: string
    description: string
    autoCurated: string
    activeState: string
    viewState: string
    loading: string
    empty: string
  }
  header: {
    title: string
    description: string
  }
  tabs: {
    library: string
    liberture100: string
    influencers: string
  }
  search: {
    placeholder: string
  }
  filters: {
    pillarLabel: string
    tagsLabel: string
  }
  heroMeta: {
    verticalEmphasisSuffix: string
    formatLabelPrefix: string
  }
  results: {
    cardsTitle: string
    cardsDescription: string
    documentsCount: string
  }
  library: {
    suggest: string
    internal: string
    external: string
    influence: string
    byPrefix: string
  }
  liberture100: {
    title: string
    description: string
    sortBy: string
    sortOptions: {
      influence: string
      pillar: string
    }
  }
  influencers: {
    title: string
    description: string
    followers: string
    publications: string
  }
  community: {
    title: string
    description: string
    voteCta: string
    suggestCta: string
  }
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
  marketplace: MarketplaceTranslations
  knowledge: KnowledgeTranslations
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
          name: "Work",
          description:
            "Optimize productivity, flow states, work environment, and professional performance for meaningful achievement.",
        },
        {
          id: "recovery",
          name: "Sleep",
          description:
            "Master sleep architecture, circadian rhythm, and recovery protocols to maximize restoration and longevity.",
        },
        {
          id: "fueling",
          name: "Nutrition",
          description: "Optimize digestion, microbiome, macros, and supplementation for peak energy and metabolic health.",
        },
        {
          id: "mental",
          name: "Mind",
          description:
            "Enhance brain function, neurotransmitters, nootropics, and mental resilience for cognitive excellence.",
        },
        {
          id: "physicality",
          name: "Exercise",
          description: "Build strength, cardiovascular capacity, mobility, and athletic performance through evidence-based training.",
        },
        {
          id: "finance",
          name: "Finance",
          description: "Master wealth creation, financial independence, and resource optimization for life freedom.",
        },
      ],
      marketplaceTypes: [
        { id: "premium", name: "Premium Protocols", count: 5 },
        { id: "opensource", name: "Open Source", count: 4 },
        { id: "coaching", name: "Coaching", count: 3 },
        { id: "books", name: "Books & Guides", count: 78 },
        { id: "video", name: "Video & Media", count: 2 },
        { id: "interactive", name: "Interactive Games", count: 3 },
        { id: "references", name: "References & History", count: 1 },
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
            description: "Work, Sleep, Nutrition, Mind, Exercise, and Finance - all unified in one system.",
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
            pillar: "Nutrition",
            type: "Premium Protocol",
            author: "Dr. Sarah Chen",
            color: "bg-fueling/20 border-fueling/30",
            icon: "fueling",
          },
          {
            title: "Deep Sleep Architecture Masterclass",
            pillar: "Sleep",
            type: "Video Course",
            author: "Prof. Matthew Walker",
            color: "bg-recovery/20 border-recovery/30",
            icon: "recovery",
          },
          {
            title: "Flow State Activation Training",
            pillar: "Work",
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
    marketplace: {
      heading: "Liberture Marketplace",
      description: "Discover protocols, expert coaching, and educational resources curated for your optimization journey.",
      searchPlaceholder: "Search protocols, coaches, books...",
      filters: {
        pillarLabel: "Filter by Optimization Domain",
        contentTypeLabel: "Filter by Content Type",
        resultsCount: "Showing {count} resources",
        typeOverrides: {
          coaching: "Coaching Services",
        },
      },
      price: {
        free: "Free",
      },
      meta: {
        byPrefix: "by",
      },
      emptyState: {
        message: "No resources found matching your filters.",
        reset: "Clear all filters",
      },
      recommendation: {
        title: "Personalized Recommendations",
        description: "Sign in to get AI-powered recommendations based on your BOS Level and performance gaps.",
        cta: "Get Personalized Picks",
      },
    },
    knowledge: {
      hero: {
        badge: "Knowledge Router",
        title: "Explore knowledge fast",
        subtitle: "Choose your lane and your format.",
        description: "Auto-curated on load",
        autoCurated: "Auto-curated on load",
        activeState: "Active",
        viewState: "View",
        loading: "Loading knowledge cards...",
        empty: "No knowledge cards available.",
      },
      header: {
        title: "Dig deeper",
        description:
          "The definitive curated library for biohackers. Books, research, white papers, and expert insights across all six optimization pillars.",
      },
      tabs: {
        library: "Document Library",
        liberture100: "Liberture 100",
        influencers: "50 Influencers",
      },
      search: {
        placeholder: "Search books, authors, topics...",
      },
      filters: {
        pillarLabel: "Filter by Optimization Domain",
        tagsLabel: "Filter by Tags",
      },
      heroMeta: {
        verticalEmphasisSuffix: " first",
        formatLabelPrefix: "Format:",
      },
      results: {
        cardsTitle: "The Liberture 100: Essential Biohacking Books",
        cardsDescription:
          "A constantly updated list of the 100 most influential and important biohacking books covering all six pillars. Ranked by community ratings, sales data, and expert review.",
        documentsCount: "Showing {count} documents",
      },
      library: {
        suggest: "Suggest Resource",
        internal: "Internal",
        external: "External",
        influence: "Influence",
        byPrefix: "by",
      },
      liberture100: {
        title: "The Liberture 100: Essential Biohacking Books",
        description:
          "A constantly updated list of the 100 most influential and important biohacking books covering all six pillars. Ranked by community ratings, sales data, and expert review.",
        sortBy: "Sort by:",
        sortOptions: {
          influence: "Influence Score",
          pillar: "Pillar",
        },
      },
      influencers: {
        title: "The 50 Influencers Index",
        description:
          "A categorized index of the 50 most renowned biohacking authors, content creators, and researchers. Each tagged with their primary domains of expertise.",
        followers: "Followers:",
        publications: "Publications:",
      },
      community: {
        title: "Contribute to the Knowledge Base",
        description:
          "Suggest books and resources for community review. Achieve BOS Level 20+ to gain voting privileges and help curate the library.",
        voteCta: "Vote on Suggestions",
        suggestCta: "Suggest Resource",
      },
    },
  },
}
