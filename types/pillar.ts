export type PillarId = 'work' | 'sleep' | 'nutrition' | 'mind' | 'exercise' | 'finance'
// Legacy alias - use PillarId instead
export type PillarSlug = PillarId

export interface PillarData {
  name: string
  slug: string
  icon: string
  tagline: string
  description: string
  color: string
  borderColor: string
}

export interface PillarConfig {
  title: string
  icon: string
  tagline: string
  description?: string
  color?: string
}

export interface PillarWithConfig {
  id: string
  config: PillarConfig
}
