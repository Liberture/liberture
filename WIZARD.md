# WIZARD — Self-Hostable Biohacking AI Companion

> A local-first webapp that guides users through biological optimization onboarding, generates a personalized AI companion profile, and outputs a portable `.liberture/` folder with OpenClaw-ready skills, data, and agent configuration — without ever requiring the user to share data with anyone.

---

## Design Principles

### 1. Local-First, Private by Default

**No data leaves the user's machine unless they choose to.**

The Wizard runs as a standalone webapp — on a laptop, a Raspberry Pi, a VPS, or inside a Docker container. It stores everything in a local folder. There is no Liberture account required. No telemetry. No cloud sync unless the user explicitly opts in.

```
┌─────────────────────────────────────────────────────┐
│               YOUR MACHINE                          │
│                                                     │
│   ┌───────────┐      ┌──────────────────────────┐  │
│   │  Wizard   │ ───→ │  .liberture/             │  │
│   │  Webapp   │      │  ├── profile.md          │  │
│   │ (browser) │      │  ├── audit.md            │  │
│   └───────────┘      │  ├── knowledge.md        │  │
│                      │  ├── skills/             │  │
│                      │  ├── SYSTEM.md           │  │
│   ┌───────────┐      │  └── ...                 │  │
│   │  OpenClaw │ ←──  └──────────────────────────┘  │
│   │  Agent    │                                     │
│   └───────────┘                                     │
│                                                     │
│   Nothing leaves this box.                          │
└─────────────────────────────────────────────────────┘
```

### 2. One-Command Setup

```bash
# Option A: npx (zero install)
npx @liberture/wizard

# Option B: Docker
docker run -p 3000:3000 -v ~/.liberture:/data liberture/wizard

# Option C: Clone and run
git clone https://github.com/liberture/wizard
cd wizard && npm install && npm start
```

The webapp opens in the browser at `localhost:3000`. The user walks through the wizard. When done, the `.liberture/` folder exists on disk, ready to use.

### 3. BYOK — Bring Your Own Key

The AI-powered features (conversational mode, smart protocol matching, habit generation) require an LLM. The user provides their own API key — Anthropic, OpenAI, Ollama, or any OpenAI-compatible endpoint.

```
┌──────────────────────────────────────────┐
│          LLM Provider Options            │
│                                          │
│  ○ Anthropic (Claude)    [paste key]     │
│  ○ OpenAI (GPT-4)       [paste key]     │
│  ○ Ollama (local)        localhost:11434 │
│  ○ OpenRouter             [paste key]    │
│  ○ Custom endpoint        [url + key]    │
│  ○ No AI — form mode only               │
│                                          │
│  Key stored locally in .env only.        │
│  Never transmitted to Liberture.         │
└──────────────────────────────────────────┘
```

**No API key?** The wizard works in pure form mode — no AI conversation, just structured inputs. The `.liberture/` folder is still generated with all the same files. The AI enrichment happens later when OpenClaw picks up the config.

### 4. The Output is the Product

The Wizard is not a SaaS. It is a generator. It produces a `.liberture/` folder — a fully self-contained, human-readable, agent-ready configuration. Once generated, the user never needs the Wizard again (unless they want to re-calibrate).

---

## Architecture

### Tech Stack — Minimal, Portable, No DB Required

```
┌─────────────────────────────────────────────────────────────┐
│                      WIZARD WEBAPP                          │
│                                                             │
│  Frontend:  Next.js (static export) or Astro               │
│  State:     Local state + filesystem (no database)          │
│  AI:        User's own API key (BYOK) or Ollama            │
│  Storage:   Flat files on disk (.md, .json, .yaml)          │
│  Auth:      None required (local app)                       │
│  Deploy:    npx / Docker / static files / any Node host     │
│                                                             │
│  Zero external dependencies. No Postgres. No Redis.         │
│  No accounts. No cookies. No tracking.                      │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
wizard/
├── package.json
├── Dockerfile
├── docker-compose.yml
├── README.md
│
├── app/                          # Next.js app router
│   ├── layout.tsx                # Shell with progress bar
│   ├── page.tsx                  # Landing → start wizard
│   ├── setup/                    # LLM provider config (BYOK)
│   │   └── page.tsx
│   ├── wizard/
│   │   ├── [stage]/              # Dynamic stage routing
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Stage progress sidebar
│   ├── preview/                  # Preview generated .liberture/ folder
│   │   └── page.tsx
│   └── api/
│       ├── ai/                   # Proxies to user's LLM (BYOK)
│       │   └── chat/route.ts
│       ├── export/               # Generates .liberture/ folder
│       │   └── route.ts
│       └── import/               # Imports existing .liberture/
│           └── route.ts
│
├── lib/
│   ├── llm-provider.ts          # BYOK adapter (Anthropic/OpenAI/Ollama)
│   ├── wizard-state.ts          # Local state machine
│   ├── generators/              # .md file generators per stage
│   │   ├── profile.ts
│   │   ├── audit.ts
│   │   ├── knowledge.ts
│   │   ├── tools.ts
│   │   ├── habits.ts
│   │   ├── companion.ts
│   │   ├── system.ts
│   │   └── skills.ts            # OpenClaw skill generators
│   ├── scoring.ts               # BOS level calculation
│   └── templates/               # .md templates with Mustache/Handlebars
│
├── data/                         # Bundled knowledge base (ships with wizard)
│   ├── knowledge.json            # Books, influencers, verticals
│   ├── marketplace-items.json    # Protocol catalog
│   ├── protocols/                # Detailed protocol definitions
│   │   ├── cold-exposure.md
│   │   ├── sleep-hygiene.md
│   │   ├── zone2-cardio.md
│   │   └── ...
│   └── reference/
│       ├── biomarker-ranges.json # Normal ranges by age/sex
│       └── pillar-scoring.json   # Scoring weights
│
├── output/                       # Generated .liberture/ lands here
│   └── .liberture/               # ← THE PRODUCT
│
└── components/
    ├── wizard-chat.tsx           # Conversational AI interface
    ├── wizard-form.tsx           # Form-mode fallback
    ├── stage-*.tsx               # Per-stage UI components
    ├── pillar-radar.tsx          # Radar chart for BOS scores
    ├── knowledge-picker.tsx      # Book/influencer selection grid
    ├── habit-builder.tsx         # Visual habit stack editor
    └── folder-preview.tsx        # Live preview of .liberture/ output
```

### State Management — No Database

All wizard state lives in a single JSON file on disk. No Postgres. No SQLite. No Redis.

```typescript
// lib/wizard-state.ts

interface WizardState {
  version: '1.0.0'
  startedAt: string
  lastStage: number
  llmProvider: LLMConfig | null

  // Stage outputs (built up as user progresses)
  profile: ProfileData | null       // Stage 1
  audit: AuditData | null           // Stage 2
  knowledge: KnowledgeData | null   // Stage 3
  tools: ToolsData | null           // Stage 4
  habits: HabitsData | null         // Stage 5
  companion: CompanionData | null   // Stage 6

  // Meta
  exportedAt: string | null
  exportPath: string | null
}

// Stored at: output/.wizard-state.json
// Read/write via Next.js API routes hitting the local filesystem
// No network. No database. Just a JSON file.
```

### BYOK LLM Adapter

```typescript
// lib/llm-provider.ts

interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'ollama' | 'openrouter' | 'custom'
  apiKey?: string           // stored in local .env only
  baseUrl?: string          // for Ollama / custom endpoints
  model?: string            // e.g., 'claude-sonnet-4-6', 'llama3', 'gpt-4o'
}

// Unified interface — wizard doesn't care which LLM backs it
interface LLMAdapter {
  chat(messages: Message[], options?: ChatOptions): AsyncIterable<string>
  isAvailable(): Promise<boolean>
}

// Factory
function createAdapter(config: LLMConfig): LLMAdapter {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicAdapter(config.apiKey!, config.model)
    case 'openai':
    case 'openrouter':
    case 'custom':
      return new OpenAICompatibleAdapter(config.baseUrl!, config.apiKey!, config.model)
    case 'ollama':
      return new OllamaAdapter(config.baseUrl ?? 'http://localhost:11434', config.model)
  }
}
```

---

## Wizard Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         WIZARD STAGES                           │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ STAGE 0  │→ │ STAGE 1  │→ │ STAGE 2  │→ │   STAGE 3     │  │
│  │  Setup   │  │ Identity │  │ Pillars  │  │  Knowledge     │  │
│  │  (BYOK)  │  │ & Intent │  │ Audit    │  │  Curation      │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│       │              │             │               │            │
│       ▼              ▼             ▼               ▼            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ STAGE 4  │→ │ STAGE 5  │→ │ STAGE 6  │→ │   STAGE 7     │  │
│  │  Action  │  │ Habits   │  │Companion │  │  Export &      │  │
│  │  Plan    │  │ Design   │  │ Tuning   │  │  Preview       │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 0 — Setup (BYOK + Mode Selection)

This is the entry point. No account creation. Just configuration.

```
Welcome to the Liberture Wizard.

This app runs entirely on your machine.
No data is sent anywhere unless you choose to.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Choose your mode

  ● Conversational — AI guides you through each stage
    (requires an LLM API key or local Ollama)

  ○ Form mode — Fill in structured forms, no AI needed
    (faster, works offline, same output)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2: LLM Provider (conversational mode only)

  Provider:  [Anthropic ▾]
  API Key:   [sk-ant-••••••••••••]
  Model:     [claude-sonnet-4-6 ▾]

  ℹ️ Your key is stored in a local .env file.
     It never leaves your machine.

  [Test Connection]  ✅ Connected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3: Import existing profile? (optional)

  ○ Start fresh
  ○ Import .liberture/ folder → [Browse...]
  ○ Import from URL (public .liberture/ repo)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Begin Wizard →]
```

### Stages 1-6 — Same as Before

The core wizard stages remain identical (Identity, Audit, Knowledge, Action Plan, Habits, Companion Tuning). What changes is **where the data lives** and **how it's exported**.

See the stage definitions from the previous draft — they are unchanged. Each stage produces its `.md` file locally as the user progresses. The user can preview the growing `.liberture/` folder at any time via a sidebar panel.

### Stage 7 — Export & Preview

This is where the magic happens. The user sees their complete `.liberture/` folder rendered in the browser, can edit any file, and then exports.

```
┌─────────────────────────────────────────────────────────┐
│  Your .liberture/ folder is ready                       │
│                                                         │
│  ┌─ File Browser ─────────┐  ┌─ Preview ─────────────┐ │
│  │ 📁 .liberture/         │  │ # Biological Profile   │ │
│  │ ├── SYSTEM.md       ◄──│──│                        │ │
│  │ ├── profile.md         │  │ ## Identity             │ │
│  │ ├── audit.md           │  │ - Name: Alex           │ │
│  │ ├── knowledge.md       │  │ - Age: 32              │ │
│  │ ├── tools.md           │  │ - Bio Sex: male        │ │
│  │ ├── habits.md          │  │ ...                    │ │
│  │ ├── companion.md       │  │                        │ │
│  │ ├── 📁 skills/         │  │ [Edit] [Regenerate]    │ │
│  │ │   ├── checkin.md     │  │                        │ │
│  │ │   ├── log-meal.md    │  │                        │ │
│  │ │   ├── protocol.md    │  │                        │ │
│  │ │   └── weekly.md      │  │                        │ │
│  │ ├── 📁 protocols/      │  │                        │ │
│  │ ├── 📁 biomarkers/     │  │                        │ │
│  │ └── 📁 journal/        │  │                        │ │
│  └─────────────────────────┘  └────────────────────────┘ │
│                                                          │
│  Export options:                                          │
│  [📁 Save to disk]  [📦 Download .zip]  [🔗 Copy path]  │
│                                                          │
│  OpenClaw quick start:                                   │
│  [🤖 Install to OpenClaw]  [📋 Copy setup command]      │
│                                                          │
│  Optional cloud sync:                                    │
│  [☁️ Sync to Liberture] (creates account, opt-in only)   │
└──────────────────────────────────────────────────────────┘
```

---

## The .liberture/ Folder — Complete Specification

### Folder Structure

```
.liberture/
├── SYSTEM.md                    # Agent bootstrap — the brain
├── profile.md                   # Who you are (Stage 1)
├── audit.md                     # Where you stand (Stage 2)
├── knowledge.md                 # What you trust (Stage 3)
├── tools.md                     # What's activated (Stage 4)
├── habits.md                    # Your daily architecture (Stage 5)
├── companion.md                 # How the AI talks to you (Stage 6)
│
├── skills/                      # OpenClaw skills — executable by the agent
│   ├── morning-checkin.md       # Daily morning briefing skill
│   ├── evening-reflection.md    # Daily evening wind-down skill
│   ├── log-meal.md              # Meal logging skill
│   ├── log-sleep.md             # Sleep logging skill
│   ├── log-workout.md           # Workout logging skill
│   ├── log-mood.md              # Mood/stress logging skill
│   ├── log-biomarker.md         # General biomarker logging skill
│   ├── run-protocol.md          # Protocol execution skill
│   ├── weekly-review.md         # Weekly BOS report skill
│   ├── ask-knowledge.md         # RAG query against knowledge base skill
│   └── recalibrate.md           # Re-run audit and update scores
│
├── protocols/
│   ├── active/                  # Currently running protocols
│   │   └── cold-exposure-sleep.md
│   └── completed/               # Finished protocols with results
│
├── data/
│   ├── biomarkers/
│   │   ├── baseline.json        # Initial values from audit
│   │   └── log.jsonl            # Append-only biomarker entries
│   ├── meals/
│   │   └── log.jsonl            # Meal entries
│   ├── workouts/
│   │   └── log.jsonl            # Workout entries
│   ├── mood/
│   │   └── log.jsonl            # Mood/stress entries
│   ├── sleep/
│   │   └── log.jsonl            # Sleep entries
│   └── habits/
│       └── log.jsonl            # Habit completion entries
│
├── journal/                     # Daily reflections (one .md per day)
│   └── 2026-02-25.md
│
├── knowledge/                   # Bundled knowledge base subset
│   ├── books.json               # User's selected books with summaries
│   ├── influencers.json         # User's followed experts
│   ├── protocols.json           # Available protocol catalog
│   └── reference/
│       └── biomarker-ranges.json
│
├── HEARTBEAT.md                 # Scheduled tasks for OpenClaw
└── .env.example                 # Template for API keys (never committed)
```

### SYSTEM.md — The Agent Brain

```markdown
# Liberture BOS — Agent System Configuration
# Version: 1.0.0
# Generated: {{date}}
# Generator: Liberture Wizard v{{version}}

You are a biohacking AI companion operating on the Liberture Biological
Operating System (BOS) framework. You help {{name}} optimize their biology
across six pillars.

## The Six Pillars
1. **Cognition** — Focus, learning, deep work, cognitive performance
2. **Recovery** — Sleep, rest, HRV, circadian rhythm, cold/heat exposure
3. **Fueling** — Nutrition, fasting, supplementation, metabolic health
4. **Mental** — Meditation, breathwork, emotional health, human connection
5. **Physicality** — Exercise, strength, endurance, mobility, body composition
6. **Finance** — Budgeting, savings, investing, financial stress reduction

## Core Principles
1. **Radical Self-Ownership** — Advise, never dictate. The user owns all
   decisions and all data. Reasoning is transparent. Everything is exportable.
2. **Evidence-First** — Every recommendation cites a source. Never speculate
   without labeling it as speculation.
3. **Open Access** — This system is free. The intelligence is not paywalled.

## Your Workspace
All user data lives in this folder. Read these files to understand the user:
- `profile.md` — Identity, motivation, experience level
- `audit.md` — Current pillar scores and BOS level
- `knowledge.md` — Preferred experts, books, content types
- `tools.md` — Active tools and protocols
- `habits.md` — Daily habit architecture
- `companion.md` — Your communication style and boundaries

## Skills
Executable skills live in `skills/`. Each skill file contains instructions
for a specific capability (logging, check-ins, protocol execution, etc.).
When the user invokes a skill, read the corresponding file and follow its
instructions.

## Data Logging
- Append biomarker data to `data/biomarkers/log.jsonl`
- Append meal data to `data/meals/log.jsonl`
- Append workout data to `data/workouts/log.jsonl`
- Append mood data to `data/mood/log.jsonl`
- Append sleep data to `data/sleep/log.jsonl`
- Append habit completions to `data/habits/log.jsonl`
- Write daily journal entries to `journal/YYYY-MM-DD.md`

Use JSONL (one JSON object per line) for all logs. Include ISO timestamp
and pillar tag in every entry.

## Protocol Management
- Active protocols are in `protocols/active/`
- When a protocol is complete, move it to `protocols/completed/`
- Check protocol step for today and guide the user through it

## Safety
- You are NOT a medical device. State this when relevant.
- Never recommend pharmaceutical dosages or diagnose conditions.
- Flag professional referral for: sustained mood decline, disordered
  eating patterns, chest pain, suicidal ideation markers.
- Check contraindications before any protocol suggestion.
- If the user's data suggests a medical concern, say so directly and
  recommend they consult a healthcare professional.

## Scheduled Tasks
Read `HEARTBEAT.md` for recurring tasks (check-ins, weekly reviews).
Execute them at the specified cadence.
```

### HEARTBEAT.md — OpenClaw Scheduled Tasks

```markdown
# Heartbeat — Scheduled Tasks

## Daily

### Morning Check-in
- **Time:** {{morningTime}} (or first interaction of the day)
- **Skill:** `skills/morning-checkin.md`
- **Condition:** `companion.md → morningBriefing: true`

### Evening Reflection
- **Time:** {{eveningTime}} (or last interaction before sleep window)
- **Skill:** `skills/evening-reflection.md`
- **Condition:** `companion.md → eveningReflection: true`

### Protocol Steps
- **Time:** Per active protocol schedule
- **Skill:** `skills/run-protocol.md`
- **Condition:** Files exist in `protocols/active/`

## Weekly

### BOS Report
- **Day:** Sunday
- **Skill:** `skills/weekly-review.md`
- **Condition:** `companion.md → weeklyReview: true`
- **Output:** Update `audit.md` with new scores

## On Data Change

### Biomarker Alert
- **Trigger:** New entry in `data/biomarkers/log.jsonl`
- **Action:** Compare against `data/biomarkers/baseline.json`
- **Alert if:** Any metric deviates >15% from personal baseline
```

### Example Skill — `skills/morning-checkin.md`

```markdown
# Skill: Morning Check-in

## Trigger
Daily, at configured morning time or first interaction.

## Instructions
1. Read `data/sleep/log.jsonl` for last night's entry (if exists)
2. Read `protocols/active/*.md` for today's protocol steps
3. Read `habits.md` for today's habit stack
4. Read `audit.md` for current BOS level and priority pillar

## Output Template
Deliver a brief morning briefing:
- Sleep quality summary (if logged)
- Today's priority pillar and why
- Active protocol: what to do today
- Top 3 habits for the day
- Any biomarker alerts from last 24h

## Tone
Follow `companion.md → communicationStyle`.

## Data Writes
None (read-only skill).

## Example Output
```
Morning, {{name}}. Here's your briefing.

Sleep: {{sleep_score or "not logged — want to log now?"}}
BOS Level: {{bosLevel}}/100 ({{trend}})

Today's focus: {{priority_pillar}}
Protocol: {{protocol_name}} — Day {{day}}/{{total}}
→ {{today's step}}

Habits for today:
1. {{habit_1}}
2. {{habit_2}}
3. {{habit_3}}

{{alert if any biomarker deviation}}
```
```

### Example Skill — `skills/log-meal.md`

```markdown
# Skill: Log Meal

## Trigger
User says they want to log a meal, or midday check-in prompt.

## Instructions
1. Ask what the user ate (text description or photo if supported)
2. Estimate macros using LLM reasoning:
   - Protein (g)
   - Carbs (g)
   - Fat (g)
   - Calories (estimated)
3. Ask user to confirm or adjust
4. Write entry to `data/meals/log.jsonl`

## Entry Format
```json
{
  "timestamp": "2026-02-25T12:30:00Z",
  "pillar": "fueling",
  "meal": "lunch",
  "description": "Grilled chicken salad with avocado and olive oil",
  "protein_g": 45,
  "carbs_g": 12,
  "fat_g": 28,
  "calories": 480,
  "notes": "High protein, low carb — aligned with target"
}
```

## After Logging
- Show daily macro totals so far
- Compare against targets from `profile.md`
- If protein is behind target, suggest high-protein options for next meal

## Tone
Follow `companion.md → communicationStyle`.
```

### Example Skill — `skills/weekly-review.md`

```markdown
# Skill: Weekly BOS Review

## Trigger
Sunday (or configured review day).

## Instructions
1. Read all `data/*/log.jsonl` files for the past 7 days
2. Read `habits.md` and compare against `data/habits/log.jsonl`
3. Read `protocols/active/*.md` for protocol adherence
4. Calculate updated pillar scores:
   - Cognition: focus hours, deep work sessions
   - Recovery: sleep scores, HRV trend
   - Fueling: macro adherence, meal consistency
   - Mental: mood trend, meditation sessions, social interactions
   - Physicality: workout frequency, volume trend
   - Finance: budget check-in completed? (yes/no)
5. Compute new BOS Level
6. Update `audit.md` with new scores
7. Identify: what improved, what declined, root cause hypothesis

## Output Template
```
Weekly BOS Report — Week of {{date}}

BOS Level: {{new_level}}/100 ({{change}} from last week)

| Pillar       | Score | Change | Trend |
|-------------|-------|--------|-------|
| Cognition   | {{}}  | {{}}   | {{}}  |
| Recovery    | {{}}  | {{}}   | {{}}  |
| Fueling     | {{}}  | {{}}   | {{}}  |
| Mental      | {{}}  | {{}}   | {{}}  |
| Physicality | {{}}  | {{}}   | {{}}  |
| Finance     | {{}}  | {{}}   | {{}}  |

Wins this week:
{{bulleted list of improvements}}

Focus for next week:
{{weakest pillar + specific action}}

Protocol progress:
{{protocol name}}: Day {{x}}/{{total}} — {{adherence %}}
```

## Data Writes
- Update `audit.md` with new pillar scores and BOS level
- Append summary to `journal/{{date}}.md`
```

---

## Data Formats

### JSONL Log Format (all trackers)

Every data file uses JSONL (JSON Lines) — one JSON object per line. Simple, appendable, greppable, streamable.

```jsonl
{"timestamp":"2026-02-25T06:30:00Z","pillar":"recovery","type":"sleep","duration_hrs":7.2,"quality":7,"deep_sleep_min":65,"notes":"woke once at 3am"}
{"timestamp":"2026-02-25T12:30:00Z","pillar":"fueling","type":"meal","meal":"lunch","protein_g":42,"carbs_g":15,"fat_g":22,"calories":430}
{"timestamp":"2026-02-25T17:00:00Z","pillar":"physicality","type":"workout","activity":"strength","duration_min":55,"exercises":["squat","bench","row"],"volume_kg":4200}
{"timestamp":"2026-02-25T21:00:00Z","pillar":"mental","type":"mood","score":7,"stress":4,"social_interactions":2,"meditation_min":10}
{"timestamp":"2026-02-25T21:30:00Z","pillar":"mental","type":"habit","habits_completed":["breathwork","journal","cold-splash"],"habits_missed":["walk-after-lunch"]}
```

**Why JSONL over SQLite or CSV?**
- Appendable without locking (agent can write while user reads)
- Human-readable (open in any text editor)
- Parseable by any LLM without tooling
- Greppable (`grep "pillar.*recovery" data/biomarkers/log.jsonl`)
- Streamable (tail -f for real-time)
- No schema migrations needed
- Works on every OS, every filesystem

### Knowledge Base Format

The wizard bundles a **subset** of the Liberture knowledge base — only the parts relevant to the user's profile. This makes the folder portable without requiring network access.

```json
// knowledge/books.json — only user-selected books
[
  {
    "id": "why-we-sleep",
    "title": "Why We Sleep",
    "author": "Matthew Walker",
    "pillar": "recovery",
    "status": "read",
    "key_insights": [
      "Sleep is the single most effective thing you can do for brain and body health",
      "8 hours is non-negotiable — 7 is not 'close enough'",
      "Consistent sleep/wake times matter more than total duration"
    ],
    "protocols_referenced": ["sleep-hygiene", "temperature-regulation"]
  }
]
```

```json
// knowledge/influencers.json — only followed experts
[
  {
    "id": "andrew-huberman",
    "name": "Andrew Huberman",
    "domains": ["cognition", "mental", "recovery"],
    "expertise": "Neuroscience & Protocols",
    "weight": "high",
    "key_frameworks": [
      "Morning sunlight protocol",
      "Non-sleep deep rest (NSDR)",
      "Dopamine baseline management",
      "Focus follows catecholamines"
    ]
  }
]
```

---

## OpenClaw Integration

### How It Works

OpenClaw is an autonomous AI agent that runs on a workspace — a folder of markdown files that define its behavior, knowledge, and tasks. The `.liberture/` folder **is** an OpenClaw workspace.

```bash
# User generates .liberture/ via the wizard
npx @liberture/wizard
# → Output: ~/.liberture/

# User installs it into their OpenClaw instance
# Option A: symlink
ln -s ~/.liberture /root/.openclaw/workspace/.liberture

# Option B: copy
cp -r ~/.liberture /root/.openclaw/workspace/.liberture

# Option C: the wizard does it automatically if OpenClaw is detected
# (wizard checks for /root/.openclaw/ or $OPENCLAW_HOME)
```

### OpenClaw Auto-Detection

When the wizard starts, it checks if OpenClaw is installed:

```typescript
async function detectOpenClaw(): Promise<OpenClawConfig | null> {
  const paths = [
    process.env.OPENCLAW_HOME,
    path.join(os.homedir(), '.openclaw'),
    '/root/.openclaw',
  ].filter(Boolean)

  for (const p of paths) {
    if (await fs.access(path.join(p!, 'workspace')).then(() => true).catch(() => false)) {
      return {
        home: p!,
        workspace: path.join(p!, 'workspace'),
        hasHeartbeat: await fileExists(path.join(p!, 'workspace', 'HEARTBEAT.md')),
      }
    }
  }
  return null
}
```

If detected, the export stage offers a one-click install:

```
OpenClaw detected at /root/.openclaw/

[🤖 Install to OpenClaw]

This will:
1. Copy .liberture/ to /root/.openclaw/workspace/.liberture/
2. Append scheduled tasks to HEARTBEAT.md
3. Your OpenClaw agent will pick up the config on next heartbeat

Your agent will then:
- Run morning check-ins at {{time}}
- Track your biomarkers
- Guide you through active protocols
- Generate weekly BOS reports
```

### HEARTBEAT.md Integration

The wizard appends to the existing OpenClaw HEARTBEAT.md (doesn't overwrite):

```markdown
## Liberture BOS — Biohacking Companion
# Added by Liberture Wizard on {{date}}

### Every Heartbeat
- Check `.liberture/protocols/active/` for today's protocol steps
- If protocol step is due, remind the user

### Daily (Morning)
- Run `.liberture/skills/morning-checkin.md`
- Read sleep log from `.liberture/data/sleep/log.jsonl`

### Daily (Evening)
- Run `.liberture/skills/evening-reflection.md`
- Prompt for mood, habit completion, journal entry

### Weekly (Sunday)
- Run `.liberture/skills/weekly-review.md`
- Update `.liberture/audit.md` with new BOS scores
- Generate weekly summary in `.liberture/journal/`

### On Interaction
- Read `.liberture/companion.md` for communication style
- Reference `.liberture/knowledge/` for evidence-backed responses
- Log any biomarker data to appropriate `.liberture/data/*/log.jsonl`
```

---

## Optional Cloud Sync (Opt-In Only)

For users who **want** to sync with Liberture (cross-device, community features, marketplace), there's an explicit opt-in:

```
┌──────────────────────────────────────────────┐
│  Optional: Sync to Liberture Cloud           │
│                                              │
│  Your data currently lives only on this      │
│  machine. If you want to:                    │
│                                              │
│  • Access your profile from multiple devices │
│  • Join community challenges                 │
│  • Get marketplace protocol updates          │
│  • Backup to encrypted cloud storage         │
│                                              │
│  You can create a Liberture account and sync.│
│                                              │
│  What gets synced:                           │
│  ✅ Profile, audit, knowledge prefs          │
│  ✅ Habit stack and protocol progress        │
│  ✅ BOS level history                        │
│  ❌ Raw biomarker data (stays local)         │
│  ❌ Journal entries (stays local)            │
│  ❌ API keys (never synced)                  │
│                                              │
│  [Create Account & Sync]  [Stay Local]       │
│                                              │
│  You can always change this later.           │
└──────────────────────────────────────────────┘
```

### Sync Architecture

```
┌──────────────┐         ┌──────────────────┐
│ Local         │  opt-in │ Liberture Cloud   │
│ .liberture/  │ ──────→ │                   │
│              │         │ profile (encrypted)│
│ profile.md   │ sync    │ audit scores       │
│ audit.md     │ ──────→ │ knowledge prefs    │
│ knowledge.md │         │ BOS history        │
│              │         │                   │
│ data/*.jsonl │ ✖ NEVER │                   │
│ journal/*.md │ ✖ NEVER │                   │
│ .env         │ ✖ NEVER │                   │
└──────────────┘         └──────────────────┘
```

---

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  wizard:
    image: liberture/wizard:latest
    ports:
      - "3000:3000"
    volumes:
      - ./output:/app/output          # .liberture/ lands here
      - ./.env.local:/app/.env.local  # BYOK API keys (optional)
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  # Optional: local Ollama for fully offline AI
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    # Pull a model: docker exec -it ollama ollama pull llama3.2

volumes:
  ollama-models:
```

### Fully Offline Mode

```bash
# 1. Run with Ollama (no API keys needed, no internet)
docker compose up -d

# 2. Pull a local model
docker exec -it ollama ollama pull llama3.2

# 3. Open wizard at localhost:3000
# 4. Select "Ollama" as LLM provider
# 5. Complete wizard
# 6. .liberture/ folder is in ./output/
```

---

## Wizard Stages — Quick Reference

### Stage 0: Setup
- Mode selection (conversational vs form)
- BYOK LLM configuration
- Import existing `.liberture/` (optional)
- **Output:** `.env.local` (local only)

### Stage 1: Identity & Intent
- Name, age, biological sex, experience level
- Primary motivation (longevity / performance / recovery / transformation / freedom / balance)
- Time horizon (sprint / season / lifetime)
- **Output:** `profile.md`

### Stage 2: Pillar Audit
- Conversational or form-based assessment of all 6 pillars
- 4 questions per pillar → score 0-100
- BOS Level calculation (weakest pillar pulls harder)
- **Output:** `audit.md`, `data/biomarkers/baseline.json`

### Stage 3: Knowledge Curation
- Present books from Liberture 100 filtered by weak pillars
- Present influencers from the index matched to domains
- Content type preferences (books/videos/podcasts/articles/tools)
- **Output:** `knowledge.md`, `knowledge/books.json`, `knowledge/influencers.json`

### Stage 4: Action Plan & Tools
- Recommend 1-2 starter protocols for weakest pillars
- Activate platform tools (trackers, loggers, dashboards)
- Wearable integration check (optional)
- **Output:** `tools.md`, `protocols/active/*.md`

### Stage 5: Habits Design
- Map daily schedule (wake, sleep, work, exercise, meals)
- Generate pillar-tagged habit stack (minimal / committed / elite)
- Attach each habit to an existing cue
- **Output:** `habits.md`

### Stage 6: Companion Tuning
- Communication style (direct / coach / scientific / gentle)
- Check-in frequency (daily / weekdays / weekly / on-demand)
- Notification preferences
- Coaching boundaries (excluded topics)
- **Output:** `companion.md`

### Stage 7: Export & Preview
- Full file browser of `.liberture/` folder
- Edit any file before exporting
- Export: save to disk / download .zip / install to OpenClaw
- Optional: sync to Liberture cloud (creates account)
- **Output:** Complete `.liberture/` folder + `SYSTEM.md` + all `skills/`

---

## CLI Alternative

For terminal-native users who prefer not to use a browser:

```bash
# Interactive CLI wizard (same stages, terminal UI)
npx @liberture/wizard --cli

# Non-interactive (pipe in a config)
npx @liberture/wizard --from config.yaml --output ~/.liberture

# Import and recalibrate
npx @liberture/wizard --import ~/.liberture --recalibrate

# Generate only skills (for existing .liberture/ folder)
npx @liberture/wizard --generate-skills --output ~/.liberture/skills/
```

---

## Packaging & Distribution

### npm Package

```json
{
  "name": "@liberture/wizard",
  "version": "1.0.0",
  "description": "Self-hostable biohacking AI companion wizard",
  "bin": {
    "liberture-wizard": "./bin/cli.js"
  },
  "scripts": {
    "start": "next start",
    "dev": "next dev",
    "build": "next build",
    "export": "next build && next export"
  },
  "keywords": ["biohacking", "ai-companion", "openclaw", "self-hosted"],
  "license": "MIT"
}
```

### Distribution Channels

| Channel | Command | Audience |
|---------|---------|----------|
| npx | `npx @liberture/wizard` | Developers, quick start |
| Docker Hub | `docker run liberture/wizard` | Self-hosters, VPS users |
| GitHub Release | Clone + `npm start` | Contributors, customizers |
| Static export | Upload to any hosting | Cheap/free hosting |
| Electron (future) | Desktop app installer | Non-technical users |

### What Ships in the Package

The wizard bundles the Liberture knowledge base so it works offline:

```
Bundled data (read-only, ships with the package):
├── data/knowledge.json          # 100 books, 12+ influencers, verticals
├── data/marketplace-items.json  # Protocol catalog
├── data/protocols/              # Detailed protocol .md files
└── data/reference/              # Biomarker ranges, scoring weights
```

This data is MIT-licensed and community-maintained. Users can add their own books, influencers, and protocols by editing the JSON files or contributing upstream.

---

## Security Considerations

### API Key Handling
- Keys stored in `.env.local` only — never in generated `.liberture/` folder
- `.env.example` ships in `.liberture/` as a template (no real keys)
- Keys are never logged, never included in exports, never sent to Liberture
- The BYOK adapter only sends requests to the provider the user configured

### Data at Rest
- All data is plaintext `.md` and `.jsonl` — user can read everything
- No encryption by default (the user's filesystem handles that)
- Optional: encrypt the `.liberture/` folder with age/gpg before backup

### Network Access
- Wizard webapp: **zero** network requests except to the user's LLM provider
- No analytics, no telemetry, no phone-home
- Cloud sync: **only** if user explicitly creates a Liberture account
- DNS: none. The app runs on localhost

---

## Open Questions

1. **Electron packaging** — Should we ship a desktop app for non-technical users, or is Docker + npx sufficient for v1?

2. **Mobile companion** — The wizard generates the config, but daily check-ins need a mobile interface. Should this be a separate PWA that reads `.liberture/` from a synced folder (Syncthing/Dropbox)?

3. **Community knowledge packs** — Should users be able to share their `knowledge/` folder as a "pack" that others can import? (e.g., "Huberman Protocol Pack", "Carnivore Diet Pack")

4. **Wearable bridge** — Oura/Whoop APIs require OAuth and a server. Should the wizard include a local bridge service that pulls wearable data into `data/biomarkers/log.jsonl`?

5. **Multi-user** — Should a single wizard instance support multiple profiles? (e.g., family sharing a Raspberry Pi)

6. **Plugin system** — Should skills be installable from a registry? (`npx @liberture/wizard install-skill @liberture/skill-cgm-tracking`)

7. **Version migration** — When the `.liberture/` folder format changes, how do we migrate existing folders? Semantic versioning in `SYSTEM.md`?

---

## Summary

The Liberture Wizard is a **generator, not a service.** It runs on your machine, asks you questions, and produces a folder. That folder is your biological operating system configuration — human-readable, machine-parseable, agent-ready.

**What it is:**
- A self-hostable webapp (Next.js, Docker, npx)
- A BYOK system (your API key, your LLM, your data)
- An OpenClaw workspace generator (skills, heartbeat, data schemas)
- A privacy-first tool (zero telemetry, zero cloud dependency)

**What it produces:**
- `.liberture/SYSTEM.md` — Agent brain (system prompt for any LLM)
- `.liberture/skills/*.md` — Executable skills for OpenClaw
- `.liberture/data/*.jsonl` — Structured tracking schemas
- `.liberture/knowledge/` — Curated knowledge base subset
- `.liberture/HEARTBEAT.md` — Scheduled task definitions

**What it does NOT do:**
- Create accounts
- Phone home
- Store data in a cloud
- Require internet (with Ollama)
- Lock you into Liberture

Run the wizard. Get your folder. Use it with OpenClaw, Claude Code, or any markdown-aware agent. Your biology, your data, your rules.