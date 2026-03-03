# Wearable Coach Skill

**Pillar:** Recovery, Physicality, Cognition  
**Author:** @liberture  
**Version:** 1.0.0

## What it does

Turns your wearable data into actionable intelligence.

Most people check their Oura/Whoop score and forget it. This skill:

1. **Syncs your data** — Oura, Whoop, Garmin, Apple Health
2. **Finds patterns** — What actually affects YOUR sleep, HRV, recovery
3. **Correlates with habits** — "Your HRV drops 15ms after alcohol"
4. **Recommends protocols** — From your trusted network, matched to your data
5. **Guides daily decisions** — "Low HRV today, skip HIIT, do Zone 2"

## The Loop

```
Wearable Data → Analysis → Correlation with Habits → Protocol Recommendations
      ↑                                                        ↓
      └──────────────── Track Protocol → Measure Impact ←──────┘
```

Your data trains the system. Community knowledge provides the protocols. Your WoT filters the noise.

## Quick start

1. Copy to skills folder:
```bash
cp -r wearable-coach ~/.openclaw/skills/
```

2. Configure your wearable API token:
```bash
cat >> ~/.openclaw/liberture/config.ini << EOF
[wearable-coach]
primary_source = oura
oura_token = your_oura_personal_access_token
EOF
```

3. Get your token:
   - **Oura:** https://cloud.ouraring.com/personal-access-tokens
   - **Whoop:** Developer portal
   - **Garmin:** OAuth flow required

## Usage examples

**Morning check-in:**
> "How's my recovery today?"

```
📊 Readiness: 78 (Good)
💓 HRV: 45ms (above baseline)
😴 Sleep: 7.2h, 88% efficiency

✅ Good day for intensity. Your HRV suggests you're recovered.
```

**Deep analysis:**
> "What's affecting my HRV?"

```
🔍 30-day HRV Analysis

Trend: +12% (improving)
Baseline: 42ms

Biggest factors:
✅ Zone 2 cardio → +8ms (next 2 days)
✅ No alcohol → +15ms
❌ Late eating → -6ms
❌ Evening workouts → -4ms

Your best HRV days: Zone 2 + no alcohol + early dinner
```

**Get recommendations:**
> "I want to improve my deep sleep"

```
Your deep sleep: 14% (target: 20%)

Recommended from your network:

1. Temperature Sleep Protocol — @huberman
   ⭐ 4.3 from 18 trusted reviews
   "Cool room + warm shower timing"
   Expected: +3-5% deep sleep

2. Glycine + Magnesium Stack — @foundmyfitness  
   ⭐ 4.1 from 12 trusted reviews
   Backed by 2 RCTs
   Expected: +2-4% deep sleep

⚠️ NOT recommended for you:
   Evening cold plunge — your data shows poor HRV response
```

**Training guidance:**
> "Should I do HIIT today?"

```
🔴 HRV is 20% below baseline.

Not a good day for HIIT. Your patterns show:
- Pushing on low-HRV days → 3 extra recovery days
- Going easy → back to baseline in 1 day

🟢 Better options today:
- Zone 2 cardio (30-45 min)
- Yoga or mobility
- Rest day
```

## Supported wearables

| Device | Data Available | API |
|--------|---------------|-----|
| **Oura Ring** | Sleep, HRV, readiness, temp, activity | REST API |
| **Whoop** | Recovery, strain, sleep, HRV | REST API |
| **Garmin** | Sleep, HRV, stress, activity, VO2max | OAuth API |
| **Apple Watch** | Sleep, HRV, activity, workouts | Export/Shortcuts |
| **Manual** | Self-reported sleep, energy, soreness | Direct input |

## Key features

### Correlation Engine
Finds what YOUR data says works — not generic advice. Requires 2-3 weeks of data to get meaningful correlations.

### WoT-Filtered Recommendations  
Protocols come from Nostr, filtered by your Web of Trust. You see what people you trust actually tried and reviewed.

### Contraindication Detection
Won't recommend protocols your data suggests won't work for you. "Your HRV tanks with evening cold exposure — skipping that one."

### Privacy First
- All data stored locally (`~/.openclaw/liberture/wearable_data/`)
- No cloud upload
- Nostr queries don't expose your health data

## Dependencies

- scipy (statistical analysis)
- requests (API calls)
- habit-tracker skill (correlation analysis)
- protocol-executor skill (starting protocols)

## How it connects

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│  Wearables  │────▶│ Wearable     │────▶│ Correlation with  │
│  (Oura,etc) │     │ Coach        │     │ Habit Tracker     │
└─────────────┘     └──────┬───────┘     └───────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Protocol Recommender  │◀──── Nostr (WoT-filtered)
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Protocol Executor     │────▶ Daily habits
              └───────────────────────┘
```

Your data informs what protocols to try. The protocols become habits. The habits get tracked. The wearable measures the impact. The loop closes.
