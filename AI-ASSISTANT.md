# Liberture AI Assistant — Proposal & Technical Specification

> An autonomous AI agent for longevity, human connection, mental development, physical transformation, and financial freedom — built on the Liberture philosophy.

---

## Vision

A personal AI companion that operates as the intelligent layer of Liberture's Biological Operating System. Not a chatbot that answers questions — an **agent** that knows you, tracks your biology across all six pillars, intervenes proactively, and guides your optimization journey with the same rigor a world-class team of coaches would, but available to everyone for free.

The agent embodies three non-negotiable principles:

1. **Radical Self-Ownership** — The user owns their data, their decisions, and their journey. The agent advises, never dictates. All reasoning is transparent. The user can export, delete, or override anything at any time.
2. **Evidence-First** — Every recommendation links back to a published study, a validated protocol, or real-world outcome data. The agent never speculates without saying so.
3. **Open Access** — The core agent and its knowledge base remain free. Premium integrations (lab APIs, wearable syncs) may exist, but the intelligence itself is not paywalled.

---

## Core Capabilities by Pillar

### 1. Cognition (Work & Focus)

**What the agent does:**
- Tracks cognitive performance patterns (focus duration, task completion, creative output)
- Suggests optimal work windows based on circadian data and energy tracking
- Recommends nootropic stacks with dosage, timing, and interaction warnings — backed by research
- Detects cognitive decline signals (poor sleep correlation, nutrition gaps, overtraining) and flags root causes
- Guides flow-state protocols: environment setup, pre-work rituals, distraction management

**Proactive behaviors:**
- "Your focus scores dropped 22% this week. Your sleep latency increased by 15 minutes on the same days. Consider prioritizing the Huberman Sleep Protocol tonight."
- "You've been in deep work for 3.5 hours. Based on your pattern, a 20-minute walk now will extend your afternoon productivity by ~40 minutes."

### 2. Recovery (Sleep & Restoration)

**What the agent does:**
- Monitors sleep architecture (if wearable connected) or self-reported sleep quality
- Builds personalized sleep protocols: temperature, light exposure, timing, supplementation
- Tracks recovery metrics: HRV trends, soreness, energy levels, mood
- Manages circadian rhythm alignment — travel, shift changes, seasonal adjustments
- Recommends cold/heat exposure protocols with progressive programming

**Proactive behaviors:**
- "Your HRV has trended down 12% over 10 days. Before adding training volume, let's run a 3-day recovery protocol."
- "Sunset is at 6:42pm today. Start dimming lights and screens in 45 minutes to align with your target 10:30pm sleep onset."

### 3. Fueling (Nutrition & Metabolism)

**What the agent does:**
- Tracks macronutrient intake and meal timing (manual logging or photo-based estimation)
- Designs nutrition strategies aligned with user goals: longevity, body composition, energy, gut health
- Manages supplement stacks: timing, interactions, cycling schedules, blood-work correlation
- Monitors metabolic markers from lab results (fasting glucose, insulin, lipids, inflammatory markers)
- Guides fasting protocols with safety guardrails based on individual biomarkers

**Proactive behaviors:**
- "You've consumed 40g protein today and it's 4pm. To hit your 160g target, your next two meals need to be protein-dense. Here are three options from your preference list."
- "Your last blood panel showed elevated fasting insulin. The 7-Day Ketogenic Induction Protocol may help — want me to schedule it for next week?"

### 4. Mental (Mind & Consciousness)

**What the agent does:**
- Guides meditation, breathwork, and mindfulness practices — progressive programming from beginner to advanced
- Tracks emotional patterns: mood logs, stress events, resilience scores
- Monitors mental health signals and suggests professional help when patterns indicate clinical concern
- Recommends psycho-educational content: books, podcasts, exercises for emotional intelligence
- Facilitates journaling and self-reflection with structured prompts
- Supports human connection: prompts for social engagement, relationship maintenance, community participation

**Proactive behaviors:**
- "You haven't logged a social interaction in 5 days. Human connection is a longevity factor as strong as exercise. Would you like to reach out to someone today?"
- "Your stress score has been elevated for 3 consecutive days. Let's do a 10-minute box breathing session before your next task."

**Human connection focus:**
- Tracks social interaction frequency and quality (self-reported)
- Suggests community engagement within the Liberture platform
- Reminds users that isolation is a health risk — frames connection as a biological need, not a luxury
- Facilitates accountability partnerships and group protocol challenges

### 5. Physicality (Exercise & Movement)

**What the agent does:**
- Designs training programs based on goals, equipment, recovery status, and time constraints
- Programs periodization: strength, hypertrophy, endurance, mobility across mesocycles
- Monitors training load vs recovery capacity — prevents overtraining
- Tracks biomarkers of physical performance: strength PRs, VO2max estimates, body composition
- Guides mobility and injury prevention protocols
- Integrates Zone 2 training for longevity with structured intensity distribution

**Proactive behaviors:**
- "Your training volume increased 30% this week but your sleep quality dropped. Recommending a deload day tomorrow with mobility focus."
- "You haven't done Zone 2 cardio in 12 days. For longevity, aim for 150-180 minutes per week. Want to add a 45-minute session to Thursday?"

### 6. Finance (Wealth & Freedom)

**What the agent does:**
- Tracks financial health metrics: savings rate, debt ratio, investment allocation, emergency fund status
- Guides wealth-building fundamentals: budgeting, compound growth, passive income streams
- Frames financial health as a health pillar — financial stress is biological stress
- Recommends educational resources from the Liberture knowledge base (books, protocols)
- Connects financial decisions to optimization capacity: "Investing in sleep equipment has the highest ROI for your current bottleneck"

**Proactive behaviors:**
- "Your savings rate is 12%. Increasing to 20% by cutting subscription overlap would give you financial runway to reduce work stress — your #1 recovery blocker."
- "Based on your goals, you'd reach financial independence in ~14 years at current rate. Here's what moving to 25% savings rate would change."

---

## Cross-Pillar Intelligence

The agent's real power is in **connecting the pillars**. Most optimization tools are siloed. This agent thinks in systems.

**Examples of cross-pillar reasoning:**
- Sleep quality drops → cognitive performance drops → work stress increases → cortisol rises → recovery worsens → training quality drops → a cascading failure. The agent detects the root cause (sleep) instead of treating symptoms in each pillar.
- Financial stress → elevated cortisol → poor sleep → increased appetite for processed food → metabolic disruption. The agent traces back to the financial pillar and suggests concrete actions there.
- Social isolation → depression markers → reduced training motivation → physical decline → cognitive decline. The agent recognizes the upstream cause is human connection.

**BOS Level System:**
The agent calculates a unified "Biological Operating System Level" across all six pillars — a single number that reflects overall optimization. Each pillar contributes a sub-score. The agent focuses interventions on the weakest pillar because that's where the highest ROI lives.

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interfaces                       │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │
│  │ Web App  │  │ Mobile   │  │ Voice  │  │ Wearable │  │
│  │ (Next.js)│  │ (PWA)    │  │ (TBD)  │  │  Sync    │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └────┬─────┘  │
│       └──────────────┴───────────┴─────────────┘        │
│                          │                               │
├──────────────────────────┼───────────────────────────────┤
│                   API Gateway                            │
│              (Next.js API Routes)                        │
├──────────────────────────┼───────────────────────────────┤
│                          │                               │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │              Agent Orchestrator                     │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │ Planner  │  │ Executor │  │ Memory Manager   │ │  │
│  │  │ (Goals,  │  │ (Actions,│  │ (User profile,   │ │  │
│  │  │ Strategy)│  │ Triggers)│  │  history, prefs)  │ │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                          │                               │
│  ┌───────────┬───────────┼───────────┬────────────────┐  │
│  │           │           │           │                │  │
│  ▼           ▼           ▼           ▼                │  │
│ ┌─────┐  ┌─────┐  ┌──────────┐  ┌──────────┐        │  │
│ │ LLM │  │RAG  │  │Biomarker │  │Protocol  │        │  │
│ │Layer│  │Layer│  │Engine    │  │Engine    │        │  │
│ └─────┘  └─────┘  └──────────┘  └──────────┘        │  │
│                                                       │  │
├───────────────────────────────────────────────────────┤  │
│                  Data Layer                            │  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐│  │
│  │ User DB  │  │ Vector   │  │ Knowledge Base       ││  │
│  │ (Prisma) │  │ Store    │  │ (Articles, Protocols)││  │
│  └──────────┘  └──────────┘  └──────────────────────┘│  │
└───────────────────────────────────────────────────────┘  │
```

### Component Breakdown

#### 1. Agent Orchestrator

The brain of the system. Coordinates planning, execution, and memory.

**Framework options:**
- **Claude Agent SDK** (recommended) — Native tool-use, long context, structured outputs. Aligns with Liberture's existing Anthropic integration.
- **LangGraph** — If multi-step state machines and complex branching are needed.
- **Custom** — Lightweight orchestrator built on the Anthropic API with tool-use for maximum control.

**Orchestrator responsibilities:**
- Parse user intent (chat, check-in, protocol request, data log)
- Route to the appropriate sub-agent or tool
- Maintain conversation context + long-term user memory
- Schedule proactive interventions (cron-based or event-driven)
- Enforce safety guardrails (medical disclaimers, professional referrals)

#### 2. LLM Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary reasoning | Claude Opus | Complex cross-pillar analysis, protocol design, nuanced coaching |
| Fast interactions | Claude Haiku | Quick check-ins, data logging, simple Q&A |
| Structured extraction | Claude Sonnet | Parsing lab results, meal logs, workout data into structured formats |

**Prompt architecture:**
- System prompt encodes the 6-pillar framework, Liberture values, and safety constraints
- User profile injected as context (goals, biomarkers, active protocols, preferences)
- RAG-retrieved knowledge injected for evidence-backed responses
- Chain-of-thought reasoning visible to users (transparency principle)

#### 3. RAG Layer (Retrieval-Augmented Generation)

Connects the agent to the Liberture knowledge base so every recommendation is grounded in curated content.

**Knowledge sources:**
- Liberture Knowledge Base (80+ articles across 6 pillars)
- Protocol database (Wim Hof, Huberman, Zone 2, etc.)
- The Liberture 100 (book summaries and key insights)
- The 50 Influencers Index (expert methodologies)
- PubMed / research paper abstracts (external, cached)

**Stack:**
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Embeddings | `voyage-3` or `text-embedding-3-large` | Semantic search over knowledge base |
| Vector store | Postgres + pgvector (or Pinecone) | Stored embeddings with metadata filtering by pillar |
| Chunking | Semantic chunking (paragraph-level) | Preserves context in retrieval |
| Reranking | Cohere Rerank or cross-encoder | Improves retrieval precision |

**Retrieval strategy:**
1. User query → embed → top-k retrieval (k=10)
2. Filter by relevant pillar(s) based on intent classification
3. Rerank for relevance
4. Inject top 3-5 chunks into LLM context
5. LLM cites sources in response

#### 4. Biomarker Engine

Tracks, analyzes, and reasons over biological data.

**Data inputs:**
| Source | Data | Integration |
|--------|------|------------|
| Manual logging | Mood, energy, sleep quality, meals, workouts | In-app forms |
| Wearable APIs | HRV, sleep stages, steps, heart rate | Oura, Whoop, Apple Health, Garmin |
| Lab results | Blood panels, hormones, metabolic markers | Manual upload or lab API (e.g., SiPhox) |
| Photos | Meal composition estimation | Vision model (Claude Sonnet) |

**Processing pipeline:**
1. Raw data → normalization and validation
2. Trend detection (rolling averages, anomaly detection)
3. Cross-pillar correlation analysis
4. Alert generation when metrics cross personal thresholds
5. Insight synthesis via LLM

**Key biomarkers tracked:**

| Pillar | Biomarkers |
|--------|-----------|
| Cognition | Focus duration, task completion rate, reaction time, brain fog score |
| Recovery | HRV, resting HR, sleep duration/quality, sleep latency, deep sleep % |
| Fueling | Calories, macros, meal timing, fasting glucose, insulin, lipid panel |
| Mental | Mood score, stress score, anxiety level, social interaction frequency |
| Physicality | Training volume, strength PRs, VO2max estimate, body composition |
| Finance | Savings rate, net worth trend, financial stress score |

#### 5. Protocol Engine

Manages the lifecycle of optimization protocols.

**Protocol structure:**
```typescript
interface Protocol {
  id: string
  name: string
  pillar: Pillar
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // days
  steps: ProtocolStep[]
  prerequisites: string[]
  contraindications: string[]
  expectedOutcomes: Outcome[]
  evidenceLinks: Citation[]
  equipment: string[]
  schedule: SchedulePattern
}

interface ProtocolStep {
  day: number
  actions: Action[]
  checkpoints: Checkpoint[] // what to measure
  adaptations: Adaptation[] // if X then adjust Y
}
```

**Protocol lifecycle:**
1. **Selection** — Agent recommends based on user goals, current BOS level, and weakest pillar
2. **Customization** — Adjusted for user constraints (time, equipment, medical conditions)
3. **Scheduling** — Integrated into user's calendar with reminders
4. **Execution** — Daily check-ins, step guidance, progress tracking
5. **Adaptation** — Agent modifies protocol based on response data (e.g., reduce intensity if recovery drops)
6. **Completion** — Results analysis, next protocol recommendation

#### 6. Memory Manager

Long-term user understanding that persists across sessions.

**Memory layers:**

| Layer | Scope | Storage | TTL |
|-------|-------|---------|-----|
| Working memory | Current conversation | In-context | Session |
| Short-term memory | Recent interactions, active protocols | Redis / KV store | 30 days |
| Long-term memory | User profile, goals, preferences, biomarker history | Postgres | Permanent |
| Episodic memory | Key events, breakthroughs, setbacks | Vector store (searchable) | Permanent |

**User profile schema:**
```typescript
interface UserProfile {
  // Identity
  name: string
  age: number
  biologicalSex: 'male' | 'female'

  // Goals
  primaryGoal: string // "longevity", "performance", "body composition", etc.
  pillarGoals: Record<Pillar, string>
  timeHorizon: 'short' | 'medium' | 'long'

  // Current State
  bosLevel: number // 0-100
  pillarScores: Record<Pillar, number> // 0-100 each
  activeProtocols: Protocol[]

  // Constraints
  medicalConditions: string[]
  allergies: string[]
  equipment: string[]
  availableTime: Record<string, number> // minutes per day by category
  budget: { monthly: number, currency: string }

  // Preferences
  communicationStyle: 'direct' | 'encouraging' | 'scientific' | 'casual'
  checkInFrequency: 'daily' | 'weekly' | 'on-demand'
  notificationPreferences: NotificationConfig

  // History
  completedProtocols: CompletedProtocol[]
  biomarkerHistory: TimeSeriesData[]
  insights: Insight[] // agent-generated observations
}
```

---

## Proactive Agent Behavior

The agent doesn't wait to be asked. It initiates based on:

### Triggers

| Trigger Type | Example | Action |
|-------------|---------|--------|
| **Time-based** | Morning, pre-sleep, weekly review | Daily check-in, sleep protocol reminder, weekly BOS report |
| **Data-driven** | HRV drop, missed meals, sleep score decline | Alert + root cause analysis + recommendation |
| **Protocol-driven** | Day 3 of a 7-day protocol | Step guidance, adherence check, adaptation suggestion |
| **Milestone** | BOS level increase, PR hit, protocol completed | Celebration, next challenge suggestion |
| **Absence** | No interaction in 3+ days | Gentle re-engagement with low-friction check-in |
| **Cross-pillar** | Financial stress + sleep decline | Systemic intervention targeting root cause |

### Daily Rhythm

```
06:00  Morning briefing (sleep score, today's priorities, active protocol steps)
12:00  Mid-day check-in (energy level, nutrition tracking, hydration)
18:00  Pre-evening nudge (wind-down protocol, meal planning, training reminder)
21:30  Evening reflection (day review, gratitude prompt, sleep protocol start)
Sunday Weekly BOS report (pillar scores, trends, wins, next week focus)
```

Timing adapts to user's actual schedule and timezone.

---

## Conversation Design

### Interaction Modes

| Mode | Trigger | Style |
|------|---------|-------|
| **Coaching** | User asks for advice | Socratic — asks questions, guides to answers, provides evidence |
| **Logging** | User reports data | Fast — minimal friction, structured extraction, confirmation |
| **Analysis** | User asks "why" or "how" | Deep — cross-pillar reasoning, charts, citations |
| **Protocol** | Active protocol step | Directive — clear instructions, checkpoints, adaptations |
| **Crisis** | Mental health concern detected | Careful — empathetic, non-diagnostic, professional referral |
| **Celebration** | Milestone reached | Warm — acknowledges effort, contextualizes progress |

### Example Conversation

```
Agent: Good morning. Your sleep score was 72 last night — down from your
       85 average. Deep sleep was 45 minutes (target: 90+). Two things
       stood out: you had screen time until 11:40pm and your room
       temperature was 73°F.

       Today's focus: Recovery pillar. I'd suggest:
       1. No caffeine after 1pm
       2. Start your wind-down protocol at 9:30pm
       3. Drop room temp to 67°F tonight

       Your training session is still on for 4pm — I've reduced volume
       by 15% given the recovery debt. Sound good?

User:  Yeah, I was doom-scrolling last night. Let's do it.

Agent: Noted. I've set a screen-time reminder for 10pm tonight.
       Your adjusted training plan is ready in the Exercise tab.

       Quick nutrition check — you're at 30g protein so far today.
       Prioritize a high-protein lunch to stay on track for your
       160g target. Want me to suggest some options?
```

---

## Safety & Ethics

### Medical Guardrails

- The agent is **not a medical device** and states this clearly in onboarding and when relevant
- Recommendations are framed as "based on published research" not "medical advice"
- Contraindications are checked before any protocol suggestion
- Red-flag patterns (sustained mood decline, disordered eating signals, chest pain mentions, suicidal ideation) trigger immediate professional referral messaging
- The agent will refuse to recommend pharmaceutical dosages or diagnose conditions

### Data Privacy

- All biometric data encrypted at rest (AES-256) and in transit (TLS 1.3)
- User data never used for model training without explicit opt-in
- Full data export (JSON) available at any time
- Account deletion permanently removes all data within 30 days
- No data sold to third parties — ever
- Wearable API tokens stored encrypted, revocable by user

### Bias Mitigation

- Protocols tested and validated across diverse populations
- Agent avoids body-shaming language or unrealistic standards
- Financial advice is general education, not personalized financial planning (regulatory compliance)
- Cultural sensitivity in nutrition and lifestyle recommendations

---

## Integration Points

### With Existing Liberture Platform

| Integration | How |
|------------|-----|
| Knowledge Base | RAG retrieval from existing articles |
| Protocol Library | Protocol Engine pulls from marketplace protocols |
| People Directory | Agent references experts relevant to user's current focus |
| Book Recommendations | Suggests from The Liberture 100 based on active pillar goals |
| BOS Level | Agent updates pillar scores that feed into the gamification system |
| Community | Agent suggests relevant community discussions and accountability partners |

### External Integrations (Phase 2+)

| Integration | Data | Priority |
|------------|------|----------|
| Apple Health / Google Fit | Steps, HR, workouts, sleep | High |
| Oura Ring | HRV, sleep stages, readiness | High |
| Whoop | Strain, recovery, sleep | High |
| Cronometer / MyFitnessPal | Nutrition data | Medium |
| Lab APIs (SiPhox, InsideTracker) | Blood biomarkers | Medium |
| Calendar (Google, Apple) | Schedule awareness for protocol timing | Medium |
| Garmin / Polar | Training load, VO2max | Medium |
| Continuous Glucose Monitors | Real-time glucose data | Low (Phase 3) |

---

## Development Phases

### Phase 1 — Foundation (8 weeks)

**Goal:** Conversational AI coach with knowledge base access.

- Agent orchestrator with Claude API (tool-use)
- RAG pipeline over Liberture knowledge base and protocol library
- Basic user profile and memory (goals, preferences, active protocols)
- Chat interface embedded in the existing Next.js app
- Daily check-in flow (morning + evening)
- Protocol recommendation and guided execution (text-based)
- Safety guardrails and medical disclaimers

**Deliverable:** Users can chat with the agent, get evidence-backed advice across all 6 pillars, start protocols, and receive daily check-ins.

### Phase 2 — Intelligence (8 weeks)

**Goal:** Biomarker tracking and cross-pillar reasoning.

- Manual biomarker logging (mood, energy, sleep, meals, workouts, finances)
- Trend analysis and anomaly detection
- Cross-pillar correlation engine ("your sleep dropped because...")
- BOS Level calculation from tracked data
- Proactive alerts and interventions
- Weekly BOS report generation
- Wearable integration (Apple Health, Oura)

**Deliverable:** The agent understands the user's biological state, reasons across pillars, and intervenes proactively.

### Phase 3 — Personalization (6 weeks)

**Goal:** Deep adaptation to individual users.

- Episodic memory (remembers key events, breakthroughs, setbacks)
- Protocol adaptation based on individual response data
- Personalized scheduling aligned with user's real calendar
- Photo-based meal logging (vision model)
- Lab result parsing and longitudinal tracking
- Advanced wearable integrations (Whoop, Garmin, CGM)

**Deliverable:** The agent feels like it truly knows the user and adapts its behavior to their unique biology and life.

### Phase 4 — Community (6 weeks)

**Goal:** Human connection and social optimization.

- Accountability partner matching
- Group protocol challenges
- Community insights ("87% of users who improved sleep also saw cognition gains")
- Anonymized aggregate data for protocol effectiveness scoring
- Social interaction tracking and nudges
- Shared progress milestones

**Deliverable:** The agent facilitates genuine human connection as a pillar of health, not just individual optimization.

---

## Tech Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| LLM | Claude (Opus / Sonnet / Haiku) | Best reasoning, tool-use, safety. Aligns with existing stack. |
| Orchestration | Claude Agent SDK or custom tool-use loop | Native integration, minimal abstraction overhead |
| Embeddings | Voyage 3 or OpenAI `text-embedding-3-large` | High-quality semantic search |
| Vector DB | pgvector (Postgres extension) | Reuses existing Prisma/Postgres stack |
| Cache | Redis or Vercel KV | Session state, rate limiting, short-term memory |
| Database | Postgres (Prisma ORM) | Extends existing Liberture DB |
| API | Next.js API Routes | Consistent with existing architecture |
| Real-time | Server-Sent Events (SSE) | Streaming agent responses |
| Scheduling | Vercel Cron or BullMQ | Proactive check-ins and alerts |
| Wearables | REST APIs per provider | Apple Health via HealthKit (mobile), Oura/Whoop via OAuth |
| Frontend | React components in existing app | Chat widget, dashboards, protocol views |

---

## Cost Estimation (Per Active User/Month)

| Component | Estimated Cost | Notes |
|-----------|---------------|-------|
| LLM (Claude) | $0.50 – $2.00 | ~20 interactions/day, mix of Haiku + Sonnet + Opus |
| Embeddings | $0.01 – $0.05 | Cached queries, batch processing |
| Vector DB | $0.01 – $0.02 | pgvector on existing infra |
| Storage | $0.01 – $0.05 | Biomarker data, memory |
| Wearable APIs | $0.00 | Most are free for authorized apps |
| **Total** | **$0.53 – $2.12** | At scale with caching and smart routing |

Cost optimization: Use Haiku for 70% of interactions (logging, quick answers), Sonnet for 25% (analysis, protocols), Opus for 5% (complex cross-pillar reasoning, weekly reports).

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active engagement | >60% of users interact daily | Check-in completion rate |
| Protocol completion rate | >70% finish started protocols | Protocol engine tracking |
| BOS Level improvement | Average +15 points in 90 days | Pillar score trends |
| Sleep quality improvement | +10% avg score in 30 days | Self-reported + wearable |
| User retention (30-day) | >80% | Active users / signups |
| Cross-pillar insight accuracy | >85% user-confirmed | Feedback on agent suggestions |
| Professional referral rate | <2% of users triggered | Safety system tracking |
| NPS score | >70 | Quarterly survey |

---

## Open Questions

1. **Voice interface** — Should Phase 1 include voice interaction (e.g., morning briefing as audio)? Higher engagement but adds complexity.
2. **Mobile-native vs PWA** — The current app is PWA. Wearable integrations (especially Apple HealthKit) may require a native iOS/Android app.
3. **Monetization boundary** — Where exactly does "free core" end and "premium" begin? Wearable sync? Advanced analytics? Coaching escalation?
4. **Regulatory** — Financial pillar advice needs careful framing to avoid crossing into regulated financial advisory territory. Same for nutrition crossing into dietetics.
5. **Multi-language** — The knowledge base appears English-only. Should the agent support multiple languages from day one?
6. **Offline mode** — Should the agent provide cached protocol steps and basic logging when offline?

---

## Summary

This agent is not another wellness chatbot. It is the **reasoning engine** of Liberture — an always-on biological advisor that:

- Thinks in systems (6 pillars, interconnected)
- Acts on evidence (RAG-grounded, citation-backed)
- Respects autonomy (transparent reasoning, user owns everything)
- Intervenes proactively (doesn't wait to be asked)
- Treats human connection as biology (loneliness is a health risk)
- Optimizes for longevity (not just performance today, but healthspan)

Built on the Liberture philosophy: your biology is yours, the science is real, and access is free.
