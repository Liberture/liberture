# Liberture Skill Ideas — Beyond Calculators

## The Bar

A skill is worth building if it:
1. **Solves a real problem** people actually have
2. **Integrates with something** (API, device, data source)
3. **Can't be replaced by ChatGPT** in 5 seconds
4. **Gets better with the trust layer** (WoT-backed recommendations)

Calculators fail this bar. What passes?

---

## High-Value Skills

### 🔗 Integration Skills

**Wearable Sync**
- Pull data from Oura, Whoop, Apple Health, Garmin
- Normalize into common format
- Agent can analyze trends, correlate with habits
- "My HRV dropped 15% this week — what changed?"

**Lab Results Parser**
- Upload blood work PDF → structured data
- Track biomarkers over time
- Flag out-of-range values
- Correlate with protocol changes
- "My fasting insulin improved after 30 days of the keto protocol"

**Supplement Stack Manager**
- Track what you're taking, doses, timing
- Flag interactions (examine.com data or similar)
- Cycling reminders (e.g., "time to cycle off caffeine")
- Cost tracking
- Links to protocols that recommend each supplement

**Food Logger (Photo-Based)**
- Snap a photo → estimate macros
- Uses vision model + nutrition DB
- Tracks over time
- "You're averaging 90g protein — your target is 150g"

### 🧠 Intelligence Skills

**Protocol Recommender**
- Based on your goals, current metrics, WoT
- "You want better sleep + you trust @huberman → try this protocol"
- Fetches from Nostr, filters by trust
- Agent can explain why it's recommending

**Study Summarizer**
- Given a PubMed ID or DOI, fetch and summarize
- Extract: sample size, methodology, findings, limitations
- Rate quality (RCT > observational > case study)
- Check if it actually supports the claim

**Correlation Finder**
- Analyze your habit/wearable data
- Find patterns you didn't notice
- "Your sleep quality drops 20% on days you have coffee after 2pm"
- "Your HRV is highest after Zone 2 cardio days"

**Progress Reporter**
- Weekly/monthly rollup of all pillars
- What improved, what declined
- Protocol adherence rates
- Generates shareable report (or Nostr post)

### ⚡ Action Skills

**Protocol Executor**
- Given a protocol, break it into daily actions
- Integrate with habit tracker
- Send reminders at right times
- Track adherence
- "Day 5 of Huberman Sleep Protocol: Morning light ✓, No screens after 9pm ✗"

**Accountability Partner**
- Check in daily on protocol adherence
- Escalating prompts if you're slipping
- Weekly review conversations
- Can post progress to Nostr (optional)

**Experiment Designer**
- Help design n=1 experiments
- Proper baseline period
- Control variables
- Statistical significance check
- "Is this improvement real or noise?"

**Fasting Timer**
- Not just a countdown — smart fasting
- Tracks your fasting windows over time
- Adjusts recommendations based on results
- Integrates with glucose data if available
- "Your longest fast was 42h. Average is 18h."

### 🏋️ Pillar-Specific Skills

**Cognition**
- Pomodoro with ultradian rhythm awareness
- Focus score tracker (based on deep work hours)
- Learning session logger (spaced repetition reminders)
- Distraction blocker coordinator

**Recovery**
- Sleep debt calculator (running total, not one-time)
- Jet lag protocol generator (based on travel dates)
- Recovery readiness score (HRV + sleep + soreness)
- Nap optimizer (when and how long based on sleep debt)

**Fueling**
- Meal timing optimizer (based on circadian rhythm)
- Hydration tracker with reminders
- Caffeine half-life tracker ("caffeine clears at 10pm")
- Gut health logger (symptoms, foods, correlations)

**Mental**
- Mood tracker with pattern detection
- Breathwork session guide (box, 4-7-8, Wim Hof)
- Gratitude journal with prompts
- Social connection tracker ("you haven't seen friends in 8 days")

**Physicality**
- Training load monitor (prevent overtraining)
- Deload week recommender
- Mobility routine generator (based on training)
- Recovery protocol post-workout

**Finance**
- Subscription auditor (find waste)
- Savings rate tracker
- Net worth logger
- "Cost per habit" calculator (ROI on health spending)

---

## What Makes These Different

| Toy Calculator | Real Skill |
|----------------|------------|
| One-time use | Ongoing value |
| No data | Integrates with your data |
| Generic output | Personalized recommendations |
| Standalone | Connects to trust layer |
| Static | Learns from your patterns |

---

## Priority Matrix

**High Impact + Easy to Build**
- Protocol Executor (uses habit-tracker skill we have)
- Study Summarizer (API call + prompting)
- Fasting Timer (state tracking)
- Progress Reporter (aggregates existing data)

**High Impact + Harder**
- Wearable Sync (multiple APIs, auth complexity)
- Lab Results Parser (PDF parsing, medical knowledge)
- Correlation Finder (data analysis, stats)
- Protocol Recommender (needs Nostr trust layer)

**Medium Impact + Easy**
- Caffeine tracker
- Hydration reminders
- Breathwork timer
- Social connection tracker

**Skip for Now**
- Anything that's just a formula (calculators)
- Anything ChatGPT does equally well
- Anything that doesn't connect to data or trust

---

## Implementation Priority

1. **Protocol Executor** — Builds on habit-tracker, high daily value
2. **Study Summarizer** — Supports trust layer, easy to build
3. **Progress Reporter** — Shows ecosystem value, shareable
4. **Fasting Timer** — Popular use case, demonstrates state tracking
5. **Wearable Sync (Oura first)** — Opens up data-driven skills
