import type { Habit, HabitCompletion, HabitTag } from "./types"

export interface TagDefinition {
  value: HabitTag
  label: string
  emoji: string
}

export const HABIT_TAGS: TagDefinition[] = [
  { value: "exercise", label: "Exercise", emoji: "\u{1F4AA}" },
  { value: "reading", label: "Reading", emoji: "\u{1F4DA}" },
  { value: "meditation", label: "Meditation", emoji: "\u{1F9D8}" },
  { value: "health", label: "Health", emoji: "\u{2764}\u{FE0F}" },
  { value: "productivity", label: "Productivity", emoji: "\u{1F680}" },
  { value: "social", label: "Social", emoji: "\u{1F91D}" },
  { value: "creative", label: "Creative", emoji: "\u{1F3A8}" },
  { value: "personal", label: "Personal", emoji: "\u{2B50}" },
  { value: "nutrition", label: "Nutrition", emoji: "\u{1F34E}" },
  { value: "sleep", label: "Sleep", emoji: "\u{1F634}" },
  { value: "mindfulness", label: "Mindfulness", emoji: "\u{1F33F}" },
  { value: "learning", label: "Learning", emoji: "\u{1F4A1}" },
  { value: "finance", label: "Finance", emoji: "\u{1F4B0}" },
  { value: "selfcare", label: "Self-Care", emoji: "\u{1F6C1}" },
]

const MESSAGES: {
  general: string[]
  exercise: string[]
  reading: string[]
  meditation: string[]
  health: string[]
  productivity: string[]
  social: string[]
  creative: string[]
  personal: string[]
  nutrition: string[]
  sleep: string[]
  mindfulness: string[]
  learning: string[]
  finance: string[]
  selfcare: string[]
  streak: {
    starting: string[]
    building: string[]
    strong: string[]
    automatic: string[]
    legendary: string[]
  }
  timeOfDay: {
    morning: string[]
    afternoon: string[]
    evening: string[]
  }
} = {
  general: [
    "Small steps lead to big changes. Keep going!",
    "You don't have to be perfect, just consistent.",
    "Every day you show up is a vote for the person you're becoming.",
    "Progress, not perfection.",
    "The secret to getting ahead is getting started.",
    "Your future self will thank you for today's effort.",
    "Consistency beats intensity. You've got this.",
    "Habits are the compound interest of self-improvement.",
    "One day at a time. One habit at a time.",
    "You're building something incredible, day by day.",
    "The only bad workout is the one that didn't happen.",
    "Discipline is choosing between what you want now and what you want most.",
    "You are what you repeatedly do. Excellence is a habit.",
    "Don't break the chain. Your streak is your commitment.",
    "A 1% improvement every day leads to massive results over time.",
  ],
  exercise: [
    "Your body is capable of more than you think. Move it!",
    "Exercise is a celebration of what your body can do.",
    "Sweat today, strength tomorrow.",
    "Every rep counts. Every step matters.",
    "You're one workout away from a better mood.",
    "Strong body, strong mind. Keep training!",
    "Movement is medicine for the mind and body.",
    "Your muscles don't know excuses, only effort.",
  ],
  reading: [
    "A reader lives a thousand lives before they die.",
    "Every page turns you into a wiser version of yourself.",
    "Books are a uniquely portable magic.",
    "Reading is to the mind what exercise is to the body.",
    "One chapter at a time. Knowledge compounds.",
    "Today's reading is tomorrow's insight.",
    "Expand your mind, one page at a time.",
    "The more you read, the more you know. The more you know, the further you go.",
  ],
  meditation: [
    "Peace comes from within. Take a moment to find it.",
    "Just breathe. The present moment is all you need.",
    "Your mind is a garden. Meditation tends it.",
    "Stillness is not the absence of movement, but the presence of peace.",
    "Even 5 minutes of calm can transform your day.",
    "You can't stop the waves, but you can learn to surf.",
    "A quiet mind is a powerful mind.",
    "Meditation: the art of doing nothing and everything at once.",
  ],
  health: [
    "Your health is your wealth. Invest wisely today.",
    "Taking care of yourself isn't selfish, it's necessary.",
    "Healthy habits today, healthy life tomorrow.",
    "Your body hears everything your mind says. Be kind.",
    "Small health choices add up to big results.",
    "You can't pour from an empty cup. Fill yours first.",
    "Health is not about the weight you lose, but the life you gain.",
    "Every healthy choice is a step toward a longer, happier life.",
  ],
  productivity: [
    "Focus on progress, not just being busy.",
    "Deep work creates deep results.",
    "Your most productive hour starts with your first focused minute.",
    "Done is better than perfect.",
    "Tackle the hardest task first. The rest is downhill.",
    "Productivity is about managing energy, not just time.",
    "One task at a time. Multitasking is a myth.",
    "Clear mind, clear goals, clear results.",
  ],
  social: [
    "Connection is a human superpower. Nurture it.",
    "A quick check-in can make someone's entire day.",
    "Relationships are built one conversation at a time.",
    "People don't remember what you said, they remember how you made them feel.",
    "Social bonds strengthen your mental health.",
    "Being present for others is the greatest gift.",
    "Strong relationships are the foundation of a fulfilling life.",
    "Reach out today. Someone is waiting to hear from you.",
  ],
  creative: [
    "Creativity is intelligence having fun. Play!",
    "Every artist was first an amateur. Keep creating.",
    "Your creative spark grows brighter with practice.",
    "There are no mistakes in creativity, only happy accidents.",
    "Create something today, even if it's imperfect.",
    "Inspiration exists, but it has to find you working.",
    "Your imagination is a muscle. Exercise it daily.",
    "The world needs your unique creative voice.",
  ],
  personal: [
    "Invest in yourself. It pays the best interest.",
    "Personal growth is a lifelong journey, not a destination.",
    "You're exactly where you need to be. Keep growing.",
    "The best project you'll ever work on is yourself.",
    "Growth happens outside your comfort zone.",
    "Be the person you needed when you were younger.",
    "Your potential is limitless. Believe it.",
    "Every day is a chance to become better than yesterday.",
  ],
  nutrition: [
    "You are what you eat. Choose fuel, not just food.",
    "Good nutrition is the foundation of a vibrant life.",
    "Your body deserves premium fuel.",
    "Eat well today, feel well tomorrow.",
    "Healthy eating isn't a diet, it's a lifestyle.",
    "Nourish your body and it will nourish your dreams.",
    "Every healthy meal is an act of self-respect.",
    "Food is not just calories, it's information for your body.",
  ],
  sleep: [
    "Sleep is the best meditation. Rest well tonight.",
    "A good night's sleep is the ultimate performance enhancer.",
    "Sleep is not a luxury, it's a necessity.",
    "Your brain consolidates memories while you sleep. Dream big.",
    "Rest today, conquer tomorrow.",
    "Quality sleep is the foundation of quality days.",
    "Your sleep routine is your superpower.",
    "Sleep is an investment in the energy you need tomorrow.",
  ],
  mindfulness: [
    "Be where you are, not where you think you should be.",
    "Mindfulness turns ordinary moments into extraordinary ones.",
    "The present moment is full of joy, if you pay attention.",
    "Awareness is the first step to transformation.",
    "Slow down. Life is happening right now.",
    "Mindfulness is not about emptying your mind, but observing it.",
    "Be gentle with yourself. You're doing the best you can.",
    "In stillness, you find your greatest strength.",
  ],
  learning: [
    "Every expert was once a beginner. Keep learning.",
    "The capacity to learn is a gift. Use it wisely.",
    "Learning never exhausts the mind, only enriches it.",
    "Curiosity is the engine of achievement.",
    "Today's lesson is tomorrow's advantage.",
    "The more you learn, the more you earn in every sense.",
    "Stay curious. Stay hungry. Stay learning.",
    "Knowledge is the one thing no one can take from you.",
  ],
  finance: [
    "Financial health is built one smart decision at a time.",
    "Save today, thank yourself tomorrow.",
    "Your future self is counting on your financial discipline today.",
    "Money management is self-management.",
    "Small savings compound into big freedom.",
    "Financial peace isn't about how much you earn, but how you manage it.",
    "Invest in your financial education. It always pays dividends.",
    "Every dollar saved is a step toward freedom.",
  ],
  selfcare: [
    "Self-care isn't selfish. It's essential.",
    "You can't serve from an empty vessel. Fill yours first.",
    "Taking time for yourself is not a luxury, it's a priority.",
    "Rest, recharge, repeat. You deserve it.",
    "Self-care is how you take your power back.",
    "Be kind to yourself. You're doing great.",
    "Your well-being matters. Protect it fiercely.",
    "Self-care is giving the world the best of you, not what's left of you.",
  ],
  streak: {
    starting: [
      "Day 1 is the hardest. You've already won by starting!",
      "Every streak starts with a single day. This is yours.",
      "The journey of a thousand miles begins with one step.",
      "You showed up today. That's what matters most.",
      "Starting is the hardest part, and you nailed it!",
    ],
    building: [
      "Your streak is growing! Momentum is on your side.",
      "A few days in and you're building real momentum.",
      "You're proving to yourself that you can do this.",
      "Consistency is taking root. Keep watering it!",
      "Your brain is already starting to rewire. Keep going!",
    ],
    strong: [
      "A week+ streak! Your brain is forming new neural pathways.",
      "You're in the habit formation zone. Don't stop now!",
      "Research shows it takes 21+ days to build a habit. You're on track!",
      "Your dedication is inspiring. Keep that streak alive!",
      "You're past the hardest part. This is becoming natural.",
    ],
    automatic: [
      "21+ days! This is becoming automatic. You're transforming.",
      "Your habit is becoming part of who you are. Identity shift!",
      "Neuroscience says you're now in the automaticity phase. Amazing!",
      "This isn't just a streak anymore, it's a lifestyle.",
      "You've proven that discipline beats motivation every time.",
    ],
    legendary: [
      "66+ days! You've achieved full habit automaticity. Legendary!",
      "Your streak is truly remarkable. You are the habit.",
      "Most people never make it this far. You're extraordinary.",
      "You've rewritten your neural pathways. This is who you are now.",
      "Your consistency is in the top 1%. Absolute champion!",
    ],
  },
  timeOfDay: {
    morning: [
      "Good morning! A great day starts with great habits.",
      "Rise and shine! Your morning routine sets the tone for the day.",
      "The early bird catches the worm. Start strong today!",
      "Morning is the time when your willpower is strongest. Use it!",
      "Today is a blank canvas. Paint it with good habits.",
    ],
    afternoon: [
      "Afternoon check-in! How are your habits going today?",
      "The day isn't over. There's still time to crush your habits.",
      "Midday momentum! Keep the energy going.",
      "Afternoon is the perfect time to recommit to your goals.",
      "Half the day done, all the potential remaining.",
    ],
    evening: [
      "Evening reflection: What did you accomplish today?",
      "Wind down with your evening habits. You've earned it.",
      "End the day strong. Tomorrow starts with tonight's choices.",
      "Evening is for gratitude. Be proud of what you did today.",
      "Rest well tonight. You showed up for yourself today.",
    ],
  },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getStreakLevel(streak: number): keyof typeof MESSAGES.streak {
  if (streak <= 2) return "starting"
  if (streak <= 6) return "building"
  if (streak <= 20) return "strong"
  if (streak <= 65) return "automatic"
  return "legendary"
}

function getCurrentTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

export function getMotivationalMessage(tags: string[], streak: number, timeOfDay?: string): string {
  const pools: string[] = []

  // Add tag-specific messages
  for (const tag of tags) {
    const tagMessages = MESSAGES[tag as keyof typeof MESSAGES]
    if (Array.isArray(tagMessages)) {
      pools.push(...tagMessages)
    }
  }

  // Add streak-level messages
  const streakLevel = getStreakLevel(streak)
  pools.push(...MESSAGES.streak[streakLevel])

  // Add time-of-day messages
  const tod = (timeOfDay || getCurrentTimeOfDay()) as keyof typeof MESSAGES.timeOfDay
  if (MESSAGES.timeOfDay[tod]) {
    pools.push(...MESSAGES.timeOfDay[tod])
  }

  // Add general messages as fallback / mix
  pools.push(...MESSAGES.general)

  return pickRandom(pools)
}

export function getDailyMotivation(habits: Habit[], completions: HabitCompletion[]): string {
  // Gather all tags from habits
  const allTags = habits.flatMap((h) => h.tags || [])
  const uniqueTags = [...new Set(allTags)]

  // Calculate average streak across habits
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const todayCompletions = completions.filter((c) => c.date === todayStr && c.completed)
  const completionRatio = habits.length > 0 ? todayCompletions.length / habits.length : 0

  // Use a simple daily seed so the message stays consistent throughout the day
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const pools: string[] = []

  // Prioritize tag-specific messages
  for (const tag of uniqueTags) {
    const tagMessages = MESSAGES[tag as keyof typeof MESSAGES]
    if (Array.isArray(tagMessages)) {
      pools.push(...tagMessages)
    }
  }

  // Add time of day
  const tod = getCurrentTimeOfDay()
  pools.push(...MESSAGES.timeOfDay[tod])

  // Add general
  pools.push(...MESSAGES.general)

  // Use day seed for stable daily message
  const index = daySeed % pools.length
  return pools[index]
}

export function getCompletionCelebration(habit: Habit, streak: number): string {
  const tags = habit.tags || []

  // Short celebration messages
  const celebrations: string[] = [
    "Great job! Keep it up!",
    "Another one done! You're on fire!",
    "Crushed it! Way to go!",
    "That's the spirit! Well done!",
    "Boom! Habit complete!",
  ]

  // Add streak-specific celebrations
  if (streak === 1) {
    celebrations.push("First day! The journey begins!")
  } else if (streak === 3) {
    celebrations.push("3-day streak! Momentum is building!")
  } else if (streak === 7) {
    celebrations.push("One week streak! You're unstoppable!")
  } else if (streak === 14) {
    celebrations.push("Two weeks strong! Neural pathways forming!")
  } else if (streak === 21) {
    celebrations.push("21 days! The habit is becoming automatic!")
  } else if (streak === 30) {
    celebrations.push("30-day milestone! You're a champion!")
  } else if (streak === 66) {
    celebrations.push("66 days! Full habit automaticity achieved!")
  } else if (streak === 100) {
    celebrations.push("100 days! You are legendary!")
  } else if (streak >= 7) {
    celebrations.push(`${streak}-day streak! Incredible consistency!`)
  }

  // Add tag-specific short celebrations
  if (tags.includes("exercise")) {
    celebrations.push("Workout done! Your body thanks you!")
  }
  if (tags.includes("reading")) {
    celebrations.push("Pages turned! Knowledge gained!")
  }
  if (tags.includes("meditation")) {
    celebrations.push("Mind cleared! Inner peace restored!")
  }

  return pickRandom(celebrations)
}
