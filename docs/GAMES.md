# Interactive Life Skills Games

## Overview

The Games section of Liberture provides interactive simulations that teach fundamental biohacking and life optimization skills. Each game features:

- **Time Control**: Speed up or slow down time to observe long-term effects
- **Visual Scene**: Character in a house with day/night cycle visible through window
- **Real-time Feedback**: Metrics and warnings based on user choices
- **Cause & Effect Learning**: See immediate and delayed consequences of decisions

## Game Engine Architecture

### Core Components

1. **GameEngine.tsx**
   - Time simulation system (configurable speed: 1x, 5x, 10x, 30x, 60x)
   - Playback controls (play/pause/reset)
   - Automatic day/night progression
   - Minute-level precision

2. **GameScene.tsx**
   - Visual representation of character and environment
   - Window showing day/night cycle (sun, moon, stars)
   - Dynamic lighting based on time and user settings
   - Animated character with multiple states (standing, sleeping, eating, exercising)

### Implemented Games

## 1. Learn to Sleep ✅

**Purpose**: Master sleep hygiene for optimal rest and recovery

**Controls**:
- **Bedtime**: Set when character goes to bed (20:00-24:00)
- **Last Meal Time**: Control when to stop eating (17:00-22:00)
- **Light Schedule**:
  - Morning Bright (100%): 5:00-9:00
  - Evening Dim (30%): 17:00-21:00
  - Night Off (0%): 20:00-23:00

**Metrics**:
- Sleep Quality (0-100%)
- Energy Level (0-100%)
- Recovery Score (0-100%)
- Consecutive Good Nights streak

**Learning Points**:
- Optimal bedtime: 22:00-23:00 (10-11 PM)
- Stop eating 3+ hours before bed
- Dim lights in evening for melatonin production
- Complete darkness during sleep
- Bright light exposure in morning for circadian rhythm

**Scoring Algorithm**:
```
Base Score: 100%
- Late bedtime (>23:00): -20%
- Eating <2h before bed: -30%
- Evening lights too bright (>20:00): -15%
- Nighttime lights on (>22:00): -15%
+ Optimal timing bonuses
```

## 2. Learn to Drink Water ✅

**Purpose**: Master proper hydration with water quality and food-based intake

**Water Types** (with different effectiveness):
- **Tap Water**: 60% effectiveness, low electrolytes (20%) - "dead water"
- **Filtered/Bottled**: 75% effectiveness, moderate electrolytes (40%)
- **Mineral Water**: 100% effectiveness, high electrolytes (85%) - optimal

**Food System**:
- 10 food items with real water content:
  - High water: Watermelon (180ml), Cucumber (150ml), Lettuce (160ml), Soup (220ml)
  - Medium: Orange (120ml), Strawberries (140ml), Yogurt (90ml)
  - Lower: Chicken (65ml), Rice (70ml), Bread (35ml)
- Eating triggers character animation
- Food provides 20-30% of daily water intake

**Metrics**:
- Hydration Level (0-100%)
- Electrolytes (0-100%)
- Energy Level (0-100%)
- Cognitive Performance (0-100%)
- Total intake from water + food

**Educational Features**:
- **"Dead Water" warning** after 3 tap water drinks
- Explains electrolyte importance (sodium, potassium, magnesium)
- Modal with water type specs before continuing
- Meal time reminders (8 AM, 1 PM, 7 PM)
- Advanced hydration science tips

**Mechanics**:
- Gradual dehydration (1%/5min) and electrolyte depletion (0.5%/5min)
- Different hydration effectiveness based on water type
- Food adds water content to daily total
- Warnings at <40% hydration and <25% electrolytes

**Learning Points**:
- Minerals are essential for cellular water absorption
- "Dead water" passes through without proper hydration
- Food contributes significantly to daily water intake
- Optimal: 2.5L total from water + food combined
- Add sea salt to tap water if mineral water unavailable

## 3. Learn to Eat 🚧

**Status**: Coming Soon

**Features** (planned):
- Calorie and macro tracking
- Real-time glucose spike visualization
- Body composition changes (muscle vs fat)
- Meal timing optimization
- Nutritional balance feedback

## 4. Learn to Exercise 🚧

**Status**: Coming Soon

**Features** (planned):
- Exercise timing and frequency
- Recovery tracking
- Strength and endurance progression
- Overtraining warnings
- Rest day optimization

## 5. Learn to Meditate 🚧

**Status**: Coming Soon

**Features** (planned):
- Daily meditation practice
- Stress level tracking
- Mental clarity metrics
- Mindfulness progression
- Consistency rewards

## 6. Learn about Finances 🚧

**Status**: Coming Soon

**Features** (planned):
- Budgeting simulation
- Savings accumulation
- Investment strategies
- Financial independence progress
- Compound interest visualization

## Adding New Games

### Step 1: Create Game Page

```typescript
// app/(site)/games/[game-name]/page.tsx
"use client"

import { GameEngine } from "@/components/games/GameEngine"
import { GameScene } from "@/components/games/GameScene"

export default function YourGamePage() {
  return (
    <GameEngine onTimeChange={handleTimeChange}>
      {(time, controls) => (
        <GameScene time={time}>
          {/* Your game-specific UI */}
        </GameScene>
      )}
    </GameEngine>
  )
}
```

### Step 2: Add to Games Index

Update `app/(site)/games/page.tsx` to include your game card.

### Step 3: Update Sitemap

Add game URL to `app/sitemap.ts`.

## Design Principles

1. **Visual Feedback**: Every action should have immediate visual response
2. **Progressive Learning**: Start simple, gradually introduce complexity
3. **No Punishment**: Encourage experimentation without harsh penalties
4. **Clear Cause & Effect**: Make relationships between actions and outcomes obvious
5. **Realistic Timelines**: Use accurate time scales for biological processes

## Technical Notes

- All games use Framer Motion for smooth animations
- Time system runs on 1-second intervals
- Character states automatically sync with time and user controls
- Light levels transition smoothly over 1 second
- Metrics update in real-time with visual progress bars

## Future Enhancements

- [ ] Save/load game progress
- [ ] Multiplayer comparison mode
- [ ] Achievement system
- [ ] Custom challenges
- [ ] Educational tooltips/explanations
- [ ] Integration with user's actual Liberture data
- [ ] Mobile-optimized controls
- [ ] Accessibility improvements (keyboard navigation, screen reader support)
