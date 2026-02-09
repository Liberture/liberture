import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const article = await prisma.knowledge.create({
    data: {
      title: 'Intermittent Fasting: A Complete Guide',
      slug: 'intermittent-fasting-complete-guide',
      excerpt: 'Learn how intermittent fasting works, its benefits for longevity and metabolic health, and how to choose the right fasting protocol for your lifestyle.',
      content: `# Intermittent Fasting: A Complete Guide

Intermittent fasting (IF) is a dietary pattern that cycles between periods of eating and fasting. Rather than restricting what you eat, it focuses on when you eat.

## Popular IF Protocols

### 16:8 Method
- Fast for 16 hours, eat within an 8-hour window
- Most popular and easiest to sustain
- Example: Eat from 12pm-8pm, fast from 8pm-12pm

### 5:2 Diet
- Eat normally 5 days per week
- Restrict calories to 500-600 for 2 non-consecutive days

### OMAD (One Meal A Day)
- Fast for 23 hours, eat one large meal
- Advanced protocol, not for beginners

## Health Benefits

**Metabolic Health**
- Improves insulin sensitivity
- Reduces blood sugar levels
- May prevent type 2 diabetes

**Longevity**
- Activates autophagy (cellular cleanup)
- Reduces inflammation
- May extend lifespan (shown in animal studies)

**Brain Health**
- Increases BDNF (brain-derived neurotrophic factor)
- May improve focus and mental clarity
- Potential protection against neurodegenerative diseases

**Weight Management**
- Easier calorie restriction without counting
- Preserves muscle mass better than continuous calorie restriction
- Boosts metabolism via norepinephrine

## Getting Started

1. **Start Slow**: Begin with 12:12 and gradually extend fasting window
2. **Stay Hydrated**: Water, black coffee, and tea are okay during fasting
3. **Break Fasts Gently**: Start with easily digestible foods
4. **Listen to Your Body**: If you feel unwell, stop and consult a doctor

## Who Should Avoid IF?

- Pregnant or breastfeeding women
- People with eating disorders
- Those with diabetes (consult doctor first)
- Children and teenagers

## Free Resources

- **r/intermittentfasting** (Reddit community)
- **Zero app** (free fasting tracker)
- **Dr. Jason Fung's YouTube channel** (expert guidance)
- **Huberman Lab podcast episodes on fasting**

Intermittent fasting is a powerful tool for metabolic health and longevity. Start conservatively and adjust based on how you feel.
`,
      pillar: 'Fueling',
      category: 'Nutrition',
      tags: ['fasting', 'metabolism', 'longevity', 'nutrition', 'autophagy'],
      isFree: true,
      featuredImage: null
    }
  });
  
  console.log('✅ Added article:', article.title);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
