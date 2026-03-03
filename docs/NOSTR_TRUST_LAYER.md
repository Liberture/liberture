# Liberture Trust Layer — Nostr Integration

## The Problem

Biohacking is full of noise:
- Influencers pushing unproven protocols
- No way to verify claims
- Cherry-picked studies
- No accountability

**Question:** How do you know if a protocol actually works? Who do you trust?

## The Solution: WoT-Backed Protocols

Use Nostr's Web of Trust to create a **trust layer for health protocols**.

### Core Concept

1. **Protocols are Nostr events** — Published, signed, verifiable
2. **Reviews are Nostr events** — People rate/review protocols they've tried
3. **WoT filtering** — See protocols endorsed by people you trust
4. **Science citations** — Link to studies, with community verification

You don't trust "Liberture" — you trust **people you follow** who've tried and reviewed protocols.

---

## Event Kinds (Proposed)

### Kind 38401: Protocol Definition

A structured protocol published to Nostr.

```json
{
  "kind": 38401,
  "tags": [
    ["d", "huberman-sleep-protocol"],
    ["title", "Huberman Sleep Protocol"],
    ["pillar", "recovery"],
    ["summary", "Morning light, evening dim, consistent schedule"],
    ["difficulty", "easy"],
    ["duration", "ongoing"],
    ["source", "https://hubermanlab.com/..."],
    ["study", "doi:10.1234/sleep.2023.001"],
    ["study", "pubmed:12345678"]
  ],
  "content": "## Full Protocol\n\n### Morning\n- Get 10min sunlight within 30min of waking\n- No sunglasses\n..."
}
```

**Tags:**
- `d` — Unique identifier (slug)
- `title` — Human-readable name
- `pillar` — Liberture pillar (cognition, recovery, fueling, mental, physicality, finance)
- `summary` — One-line description
- `difficulty` — easy / medium / hard
- `duration` — acute / 7-day / 30-day / ongoing
- `source` — Original source URL
- `study` — DOI or PubMed ID for scientific backing (multiple allowed)

**Content:** Full protocol in markdown.

### Kind 38402: Protocol Review

A user's review of a protocol they've tried.

```json
{
  "kind": 38402,
  "tags": [
    ["a", "38401:<pubkey>:<d-tag>"],
    ["rating", "4"],
    ["tried-duration", "30d"],
    ["outcome", "positive"]
  ],
  "content": "Did this for 30 days. Definitely noticed faster sleep onset (~15min vs 30min before). Morning light is the game changer. Hard to maintain on cloudy days."
}
```

**Tags:**
- `a` — Reference to the protocol being reviewed
- `rating` — 1-5 stars
- `tried-duration` — How long they tried it
- `outcome` — positive / neutral / negative / mixed

**Content:** Free-form review text.

### Kind 38403: Study Verification

Community verification of a scientific citation.

```json
{
  "kind": 38403,
  "tags": [
    ["a", "38401:<pubkey>:<d-tag>"],
    ["study", "doi:10.1234/sleep.2023.001"],
    ["verdict", "supports"],
    ["quality", "rct"],
    ["n", "120"]
  ],
  "content": "Randomized controlled trial with 120 participants. Morning light exposure group showed 23% improvement in sleep latency vs control. Methodology solid, funding disclosed (no conflicts)."
}
```

**Tags:**
- `a` — Reference to the protocol
- `study` — The study being verified
- `verdict` — supports / partial / contradicts / unrelated
- `quality` — rct / meta-analysis / observational / case-study / in-vitro
- `n` — Sample size

---

## WoT Integration

### Trust Score for Protocols

A protocol's trust score is calculated from:

1. **Author trust** — Is the protocol author in your WoT?
2. **Review trust** — Reviews from people in your WoT weighted higher
3. **Verification trust** — Study verifications from trusted sources

```
protocol_trust = 
  (author_wot_score * 0.3) +
  (avg_trusted_review_rating * 0.4) +
  (verified_study_count * 0.3)
```

### Filtering

On Liberture, you see:
- **Your Feed:** Protocols from people you follow or 2-hop WoT
- **Trusted Reviews:** Only reviews from your WoT (or highlighted)
- **Verified Science:** Studies verified by trusted community members

No anonymous ratings. No astroturfing. **Real people you trust.**

---

## User Experience

### Browse Protocols

```
/protocols/recovery

┌─────────────────────────────────────────────────────────┐
│ 😴 Recovery Protocols                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⭐ Huberman Sleep Protocol                    [Easy]    │
│    Morning light + evening wind-down                    │
│    👤 @huberman · 📊 4.2★ (23 trusted reviews)         │
│    🔬 3 verified studies                                │
│                                                         │
│ ⭐ 8-Hour Sleep Window                        [Medium]  │
│    Non-negotiable 8hr window, no exceptions             │
│    👤 @foundmyfitness · 📊 4.5★ (8 trusted reviews)    │
│    🔬 5 verified studies                                │
│                                                         │
│ ○ Cold Plunge Recovery                        [Hard]    │
│    Post-workout cold exposure protocol                  │
│    👤 @random_user · 📊 3.1★ (2 trusted reviews)       │
│    🔬 1 verified study                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

⭐ = Author or reviewers in your WoT
○ = Outside your trust network (shown but de-emphasized)
```

### Protocol Detail

```
/protocols/huberman-sleep-protocol

┌─────────────────────────────────────────────────────────┐
│ Huberman Sleep Protocol                                 │
│ by @huberman (followed by 12 people you trust)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ## Summary                                              │
│ Morning sunlight exposure + evening light reduction     │
│ to optimize circadian rhythm and sleep quality.         │
│                                                         │
│ ## The Protocol                                         │
│ 1. Get 10min direct sunlight within 30min of waking    │
│ 2. No sunglasses during morning light exposure          │
│ 3. Dim lights after sunset                              │
│ 4. No screens 1hr before bed (or use red filter)       │
│ ...                                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 🔬 Scientific Backing                                   │
│                                                         │
│ ✅ "Morning light and circadian entrainment"            │
│    doi:10.1234/sleep.2023.001 · RCT, n=120             │
│    Verified by @scientist_you_follow                    │
│                                                         │
│ ✅ "Light exposure and melatonin suppression"           │
│    pubmed:12345678 · Meta-analysis, n=2,340            │
│    Verified by @foundmyfitness                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 💬 Trusted Reviews                                      │
│                                                         │
│ @friend_you_trust (tried 60d) ⭐⭐⭐⭐⭐                │
│ "Life changing. Sleep latency went from 45min to 10min" │
│                                                         │
│ @another_friend (tried 14d) ⭐⭐⭐⭐                     │
│ "Works well in summer. Hard in winter with less sun."   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Integration with OpenClaw Skills

Protocols can reference Liberture skills:

```json
{
  "kind": 38401,
  "tags": [
    ["d", "sleep-timing-protocol"],
    ["skill", "sleep-cycle-calculator"],
    ["skill", "habit-tracker"]
  ],
  "content": "## Protocol\n\n1. Use the **sleep-cycle-calculator** skill to find optimal bedtime\n2. Track with **habit-tracker** skill\n..."
}
```

Your agent can:
1. Fetch protocols from your WoT
2. Execute referenced skills
3. Track your progress
4. Even submit reviews on your behalf

---

## Why This Matters

| Current State | With Nostr Trust Layer |
|---------------|------------------------|
| Anonymous ratings | Reviews from real people you trust |
| No accountability | Signed events, reputation at stake |
| Cherry-picked studies | Community-verified science |
| Influencer hype | WoT-filtered signal |
| Centralized platform risk | Decentralized, censorship-resistant |

**The killer feature isn't the protocols. It's knowing who to trust.**

---

## Implementation Phases

### Phase 1: Read-Only
- Liberture website fetches protocols from Nostr
- Displays WoT-filtered results (using nostr-wot SDK)
- Links to relays for reviews

### Phase 2: Write Support
- Publish protocols from Liberture
- Submit reviews (NIP-07 signing)
- Verify studies

### Phase 3: Agent Integration
- OpenClaw skills can fetch trusted protocols
- Agent can suggest protocols based on your WoT
- Automatic progress tracking and review submission

---

## Open Questions

1. **Relay strategy:** Dedicated Liberture relay or existing relays?
2. **NIP submission:** Formalize these event kinds as NIPs?
3. **Migration:** How to import existing Liberture content?
4. **Spam prevention:** Require WoT membership to publish?
5. **Study verification:** Who qualifies to verify studies? Credentials?
