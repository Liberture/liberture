import { StreakData, RewardConfig } from './types'

export interface Reward {
  type: 'milestone' | 'variable' | 'freeze_earned'
  message: string
  emoji: string
  special?: boolean
}

/**
 * Generate a reward based on streak and configuration
 */
export function generateReward(
  streakData: StreakData,
  rewardConfig: RewardConfig
): Reward | null {
  const { current, milestones } = streakData

  // Check for milestone rewards (predictable)
  const reachedMilestone = milestones.find(
    m => m.days === current && !m.celebrated
  )

  if (reachedMilestone) {
    return {
      type: 'milestone',
      message: getMilestoneMessage(reachedMilestone.days),
      emoji: getMilestoneEmoji(reachedMilestone.days),
      special: reachedMilestone.days >= 21
    }
  }

  // Check for freeze earned
  if (current > 0 && current % 7 === 0) {
    return {
      type: 'freeze_earned',
      message: `You earned a streak freeze! Use it to protect your streak on a tough day.`,
      emoji: '🧊',
      special: false
    }
  }

  // Variable rewards (30% chance on non-milestone days)
  if (rewardConfig.variableRewards && Math.random() < 0.3) {
    return {
      type: 'variable',
      message: getRandomRewardMessage(current),
      emoji: getRandomEmoji(),
      special: false
    }
  }

  return null
}

/**
 * Get milestone message
 */
function getMilestoneMessage(days: number): string {
  const messages: Record<number, string> = {
    3: "3 days! Your brain is starting to form new neural pathways! 🧠",
    7: "1 week streak! You're in the top 20% of habit builders! 🌟",
    21: "21 days! Neural pathway established. This is becoming automatic! ⚡",
    30: "30 days strong! You've built real momentum! 🚀",
    66: "66 DAYS! Scientific automaticity achieved! This habit is now part of who you are! 🏆",
    100: "100 DAYS! You're a legend! This is exceptional dedication! 👑",
  }

  return messages[days] || `${days} day streak! Incredible consistency! 🔥`
}

/**
 * Get milestone emoji
 */
function getMilestoneEmoji(days: number): string {
  const emojis: Record<number, string> = {
    3: '🎯',
    7: '🌟',
    21: '⚡',
    30: '🚀',
    66: '🏆',
    100: '👑',
  }

  return emojis[days] || '🔥'
}

/**
 * Get random reward message for variable rewards
 */
function getRandomRewardMessage(streak: number): string {
  const messages = [
    `Fun fact: Completing habits releases dopamine, your brain's reward chemical! 🧪`,
    `You're building discipline that transfers to all areas of life! 💎`,
    `Consistency beats intensity. You're proving that every day! 📈`,
    `Your future self is thanking you right now! 🙏`,
    `Small actions, repeated daily, create extraordinary results! ✨`,
    `You're in the top 10% of people tracking habits consistently! 🎖️`,
    `Every day you're rewiring your brain for success! 🔄`,
    `The compound effect is working in your favor! 💰`,
    `You're not just building a habit, you're building character! 🎭`,
    `Research shows it takes 66 days to form a habit. You're ${Math.min(100, Math.round((streak / 66) * 100))}% there! 📊`,
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Get random emoji
 */
function getRandomEmoji(): string {
  const emojis = ['⭐', '💫', '✨', '🌈', '🎉', '💪', '🔥', '⚡', '🎯', '🚀']
  return emojis[Math.floor(Math.random() * emojis.length)]
}

/**
 * Check if user should see celebration
 */
export function shouldShowCelebration(
  streakData: StreakData,
  rewardConfig: RewardConfig
): boolean {
  if (!rewardConfig.celebrationsEnabled) return false

  const { current, milestones } = streakData

  // Show celebration for milestones
  const hasUncelebratedMilestone = milestones.some(
    m => m.days === current && !m.celebrated
  )

  return hasUncelebratedMilestone
}

/**
 * Get celebration intensity (for confetti amount)
 */
export function getCelebrationIntensity(days: number): 'low' | 'medium' | 'high' | 'epic' {
  if (days >= 100) return 'epic'
  if (days >= 66) return 'high'
  if (days >= 21) return 'medium'
  return 'low'
}

/**
 * Get share message for social sharing
 */
export function getShareMessage(days: number, habitName: string, identityType?: string): string {
  if (days >= 100) {
    return `I just hit a 100-day streak with ${habitName}! 💯🔥`
  }
  if (days >= 66) {
    return `66 days of ${habitName}! Habit automaticity achieved! 🏆`
  }
  if (days >= 21) {
    return `21-day streak with ${habitName}! ${identityType ? `I'm a ${identityType}!` : 'Building strong habits!'} ⚡`
  }
  if (days >= 7) {
    return `1 week streak with ${habitName}! ${identityType ? `Becoming a ${identityType}` : 'Consistency is key!'} 🌟`
  }

  return `${days} day streak with ${habitName}! ${identityType ? `Building my ${identityType} identity` : 'One day at a time!'} 🎯`
}
