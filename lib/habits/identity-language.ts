/**
 * Identity Language Utilities
 * Maps habits to identity types and generates identity-based messaging
 */

export interface IdentityMapping {
  identity: string
  completionMessage: string
  progressMessage: string
  milestoneMessages: Record<number, string>
}

/**
 * Get identity type from habit name or category
 */
export function getIdentityForHabit(habitName: string, category?: string): string {
  const name = habitName.toLowerCase()
  const cat = category?.toLowerCase()

  // Exercise/Fitness identities
  if (name.match(/run|jog|sprint/) || cat === 'running') return 'runner'
  if (name.match(/gym|lift|weight|strength/) || cat === 'strength') return 'athlete'
  if (name.match(/yoga|stretch/) || cat === 'yoga') return 'yogi'
  if (name.match(/walk|hike/) || cat === 'walking') return 'walker'
  if (name.match(/swim/) || cat === 'swimming') return 'swimmer'
  if (name.match(/bike|cycle/) || cat === 'cycling') return 'cyclist'
  if (name.match(/exercise|workout|fitness/) || cat === 'exercise') return 'athlete'

  // Reading/Learning identities
  if (name.match(/read|book/) || cat === 'reading') return 'reader'
  if (name.match(/study|learn|course/) || cat === 'learning') return 'learner'
  if (name.match(/write|journal/) || cat === 'writing') return 'writer'

  // Mindfulness identities
  if (name.match(/meditat/) || cat === 'meditation') return 'meditator'
  if (name.match(/mindful|breathe|calm/) || cat === 'mindfulness') return 'mindful person'
  if (name.match(/gratitude/) || cat === 'gratitude') return 'grateful person'

  // Health identities
  if (name.match(/water|hydrat/) || cat === 'hydration') return 'healthy person'
  if (name.match(/sleep|rest/) || cat === 'sleep') return 'well-rested person'
  if (name.match(/vitamin|supplement/) || cat === 'supplements') return 'health-conscious person'
  if (name.match(/diet|nutrition|eat/) || cat === 'nutrition') return 'mindful eater'

  // Productivity identities
  if (name.match(/code|program/) || cat === 'coding') return 'developer'
  if (name.match(/clean|organize|tidy/) || cat === 'organization') return 'organized person'
  if (name.match(/plan|schedule/) || cat === 'planning') return 'planner'

  // Creative identities
  if (name.match(/draw|sketch|paint/) || cat === 'art') return 'artist'
  if (name.match(/music|instrument|practice/) || cat === 'music') return 'musician'
  if (name.match(/create|craft/) || cat === 'creative') return 'creative person'

  // Social identities
  if (name.match(/call|text|friend|family/) || cat === 'social') return 'connected person'

  // Morning routine
  if (name.match(/morning|wake/) || cat === 'morning_routine') return 'morning person'

  // Default
  return 'dedicated person'
}

/**
 * Get completion message based on identity
 */
export function getCompletionMessage(identity: string, usePrefix: boolean = true): string {
  const prefix = usePrefix ? 'I am a' : 'You are a'

  // Handle identities that need different articles
  const vowelStart = ['a', 'e', 'i', 'o', 'u'].includes(identity[0].toLowerCase())
  const article = vowelStart ? 'an' : 'a'

  return `${prefix}${usePrefix ? '' : ' '}${article} ${identity}`
}

/**
 * Get identity milestone messages
 */
export function getIdentityMilestone(identity: string, days: number): string {
  const messages: Record<number, (identity: string) => string> = {
    3: (id) => `3 days! You're proving to yourself that you're a ${id}.`,
    7: (id) => `A full week! Being a ${id} is becoming part of who you are.`,
    21: (id) => `21 days! The neural pathway is established. You're a ${id}.`,
    30: (id) => `30 days strong! You've fully embodied the identity of a ${id}.`,
    66: (id) => `66 days! Scientific automaticity achieved. Being a ${id} is now automatic.`,
    100: (id) => `100 DAYS! You're not trying to be a ${id} — you ARE a ${id}.`,
  }

  const generator = messages[days]
  return generator ? generator(identity) : `${days} days as a ${identity}!`
}

/**
 * Get identity-based progress message
 */
export function getIdentityProgress(identity: string, currentStreak: number, targetDays: number): string {
  const progress = (currentStreak / targetDays) * 100

  if (progress < 25) {
    return `You're becoming a ${identity}. Every day counts!`
  } else if (progress < 50) {
    return `Your ${identity} identity is taking shape!`
  } else if (progress < 75) {
    return `You're over halfway to being a fully automatic ${identity}!`
  } else if (progress < 100) {
    return `Almost there! The ${identity} identity is nearly automatic!`
  } else {
    return `You ARE a ${identity}! This is who you are now.`
  }
}

/**
 * Get complete identity mapping for a habit
 */
export function getIdentityMapping(habitName: string, category?: string): IdentityMapping {
  const identity = getIdentityForHabit(habitName, category)

  return {
    identity,
    completionMessage: getCompletionMessage(identity, true),
    progressMessage: getIdentityProgress(identity, 0, 66),
    milestoneMessages: {
      3: getIdentityMilestone(identity, 3),
      7: getIdentityMilestone(identity, 7),
      21: getIdentityMilestone(identity, 21),
      30: getIdentityMilestone(identity, 30),
      66: getIdentityMilestone(identity, 66),
      100: getIdentityMilestone(identity, 100),
    }
  }
}

/**
 * Get button text for habit completion (identity-based)
 */
export function getCompletionButtonText(identity: string, completed: boolean): string {
  if (completed) {
    return '✓ Done'
  }

  return getCompletionMessage(identity, true)
}

/**
 * Get encouragement message based on streak
 */
export function getEncouragementMessage(identity: string, streak: number): string {
  if (streak === 0) {
    return `Start your journey as a ${identity} today!`
  } else if (streak < 3) {
    return `You're on your way to becoming a ${identity}!`
  } else if (streak < 7) {
    return `Keep going! Every day you're more of a ${identity}.`
  } else if (streak < 21) {
    return `You're building the ${identity} identity!`
  } else if (streak < 66) {
    return `You're a ${identity}! Keep reinforcing it.`
  } else {
    return `Being a ${identity} is automatic now!`
  }
}
