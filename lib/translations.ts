import en from "@/messages/en.json"
import es from "@/messages/es.json"

import type { PillarId } from "@/lib/constants/pillars"
export type { PillarId } from "@/lib/constants/pillars"
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

export type Locale = "en" | "es"
export type HabitsDictionary = typeof en.habits
export type Catalog = Translations & { habits: HabitsDictionary }

// Structured arrays include pillar IDs and presentation data used by the existing UI.
export const translations = { en, es: es satisfies typeof en } as Record<Locale, Catalog>
