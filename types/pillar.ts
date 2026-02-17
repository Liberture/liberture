export type PillarSlug = 'cognition' | 'recovery' | 'fueling' | 'mental' | 'physicality' | 'finance'
export type PillarId = 'work' | 'sleep' | 'nutrition' | 'mind' | 'exercise' | 'finance'

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
