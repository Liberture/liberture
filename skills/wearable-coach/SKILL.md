---
name: wearable-coach
description: "Analyze fitness data from smartwatches/wearables, detect patterns, recommend protocols based on your metrics and community knowledge. Integrates with Oura, Whoop, Garmin, Apple Health. Use when the user asks about their HRV, recovery, sleep quality, training readiness, or wants personalized protocol recommendations."
---

# Wearable Coach Skill

Your data + community knowledge = personalized recommendations.

**Pillar:** Recovery, Physicality, Cognition  
**Author:** @liberture  
**Version:** 1.0.0  
**Integrates with:** protocol-executor, Nostr trust layer

## The Idea

Wearables collect tons of data. Most people look at it once and forget.

This skill:
1. **Pulls your data** from Oura, Whoop, Garmin, Apple Health
2. **Analyzes patterns** — HRV trends, sleep architecture, recovery scores
3. **Correlates with your habits** — what actually moves the needle for YOU
4. **Recommends protocols** — from your WoT, matched to your current state
5. **Adapts daily** — "HRV is down, skip HIIT today, try Zone 2"

## Interface

### Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | yes | `sync`, `status`, `analyze`, `recommend`, `correlate` |
| `source` | string | for sync | `oura`, `whoop`, `garmin`, `apple_health`, `manual` |
| `days` | number | optional | Days of data to analyze (default 30) |
| `metric` | string | for analyze | Specific metric to deep-dive |
| `goal` | string | for recommend | What user wants to optimize |

### Outputs

#### status — Daily readiness briefing

```json
{
  "date": "2026-03-03",
  "readiness_score": 78,
  "readiness_status": "good",
  "hrv": {
    "value": 45,
    "baseline": 42,
    "trend": "above_baseline",
    "percentile": 65
  },
  "sleep": {
    "duration": 7.2,
    "efficiency": 88,
    "deep_pct": 18,
    "rem_pct": 22,
    "quality_score": 82
  },
  "recovery": {
    "score": 75,
    "strain_yesterday": 12.4,
    "recommended_strain_today": "moderate"
  },
  "recommendations": [
    {
      "type": "training",
      "message": "Good recovery. You can handle moderate-high intensity today.",
      "confidence": "high"
    },
    {
      "type": "protocol",
      "message": "Your deep sleep is below target. Consider the 'Temperature Sleep Protocol' — 4.3★ from your network.",
      "protocol_id": "temperature-sleep",
      "confidence": "medium"
    }
  ]
}
```

#### analyze — Deep dive on a metric

```json
{
  "metric": "hrv",
  "period": "30d",
  "summary": {
    "mean": 42,
    "std": 8,
    "trend": "improving",
    "trend_pct": "+12%",
    "best_day": "2026-02-15",
    "worst_day": "2026-02-22"
  },
  "correlations": [
    {
      "factor": "alcohol",
      "impact": -15,
      "confidence": "high",
      "note": "HRV drops ~15ms on days after drinking"
    },
    {
      "factor": "zone2_cardio",
      "impact": +8,
      "confidence": "medium",
      "note": "HRV higher 2 days after Zone 2 sessions"
    },
    {
      "factor": "late_eating",
      "impact": -6,
      "confidence": "medium",
      "note": "Eating after 8 PM correlates with lower next-day HRV"
    }
  ],
  "insights": [
    "Your HRV is trending up — whatever you're doing is working",
    "Biggest detractor: alcohol. Consider tracking this more closely.",
    "Your best HRV days follow Zone 2 cardio with no alcohol"
  ]
}
```

#### recommend — Protocol recommendations based on data

```json
{
  "goal": "improve_deep_sleep",
  "current_metrics": {
    "deep_sleep_pct": 14,
    "target": 20,
    "gap": "below_target"
  },
  "recommended_protocols": [
    {
      "id": "temperature-sleep",
      "name": "Temperature Sleep Protocol",
      "source": "nostr",
      "author": "@huberman",
      "wot_rating": 4.3,
      "trusted_reviews": 18,
      "match_reason": "Addresses deep sleep specifically. Cool room + warm shower timing.",
      "expected_impact": "+3-5% deep sleep based on similar users",
      "difficulty": "easy"
    },
    {
      "id": "glycine-magnesium",
      "name": "Glycine + Magnesium Protocol",
      "source": "nostr", 
      "author": "@foundmyfitness",
      "wot_rating": 4.1,
      "trusted_reviews": 12,
      "match_reason": "Supplement stack shown to increase deep sleep. Backed by RCTs.",
      "expected_impact": "+2-4% deep sleep",
      "difficulty": "easy",
      "studies": ["pubmed:22293292", "doi:10.1111/jsr.12084"]
    }
  ],
  "not_recommended": [
    {
      "id": "cold-plunge-evening",
      "reason": "Your HRV responds poorly to evening cold exposure based on your data"
    }
  ]
}
```

#### correlate — Find what affects your metrics

```json
{
  "metric": "sleep_quality",
  "factors_analyzed": 15,
  "significant_correlations": [
    {
      "factor": "screen_cutoff",
      "habit_id": "habit-125",
      "correlation": 0.72,
      "direction": "positive",
      "interpretation": "Days you stop screens early → better sleep quality",
      "sample_size": 23
    },
    {
      "factor": "caffeine_after_2pm",
      "correlation": -0.58,
      "direction": "negative",
      "interpretation": "Afternoon caffeine → worse sleep",
      "sample_size": 18
    },
    {
      "factor": "evening_workout",
      "correlation": -0.31,
      "direction": "negative",
      "interpretation": "Late workouts slightly hurt sleep (but effect is small)",
      "sample_size": 12
    }
  ],
  "no_correlation": [
    "meditation",
    "supplement_magnesium"
  ],
  "insufficient_data": [
    "cold_shower"
  ]
}
```

## Data Sources

### Oura Ring

```python
OURA_API = "https://api.ouraring.com/v2"

def sync_oura(token, days=30):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Sleep data
    sleep = requests.get(
        f"{OURA_API}/usercollection/sleep",
        headers=headers,
        params={"start_date": start_date, "end_date": end_date}
    ).json()
    
    # Readiness scores
    readiness = requests.get(
        f"{OURA_API}/usercollection/daily_readiness",
        headers=headers,
        params={"start_date": start_date, "end_date": end_date}
    ).json()
    
    # HRV
    hrv = requests.get(
        f"{OURA_API}/usercollection/heartrate",
        headers=headers,
        params={"start_date": start_date, "end_date": end_date}
    ).json()
    
    return normalize_oura_data(sleep, readiness, hrv)
```

### Whoop

```python
WHOOP_API = "https://api.prod.whoop.com/developer/v1"

def sync_whoop(token, days=30):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Recovery
    recovery = requests.get(
        f"{WHOOP_API}/recovery",
        headers=headers
    ).json()
    
    # Sleep
    sleep = requests.get(
        f"{WHOOP_API}/activity/sleep",
        headers=headers
    ).json()
    
    # Strain
    strain = requests.get(
        f"{WHOOP_API}/cycle",
        headers=headers
    ).json()
    
    return normalize_whoop_data(recovery, sleep, strain)
```

### Garmin

```python
# Garmin requires OAuth flow
GARMIN_API = "https://apis.garmin.com/wellness-api/rest"

def sync_garmin(token, days=30):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Daily summaries
    summaries = requests.get(
        f"{GARMIN_API}/dailies",
        headers=headers
    ).json()
    
    # Sleep
    sleep = requests.get(
        f"{GARMIN_API}/sleeps",
        headers=headers
    ).json()
    
    # HRV
    hrv = requests.get(
        f"{GARMIN_API}/hrv",
        headers=headers
    ).json()
    
    return normalize_garmin_data(summaries, sleep, hrv)
```

### Apple Health (via Shortcuts/Export)

```python
def import_apple_health(export_path):
    """
    Apple Health doesn't have a direct API.
    Options:
    1. iOS Shortcut that exports and sends to server
    2. Manual XML export from Health app
    3. Third-party sync (HealthSync, etc.)
    """
    # Parse export.xml
    tree = ET.parse(export_path)
    records = tree.findall('.//Record')
    
    data = {
        "hrv": extract_hrv(records),
        "sleep": extract_sleep(records),
        "activity": extract_activity(records),
        "heart_rate": extract_hr(records)
    }
    
    return normalize_apple_data(data)
```

### Manual Entry

For users without wearables:

```python
def log_manual(metrics):
    """
    Accept manual entries for key metrics:
    - sleep_hours
    - sleep_quality (1-10)
    - energy (1-10)
    - soreness (1-10)
    - mood (1-10)
    - resting_hr (if known)
    """
    return {
        "source": "manual",
        "date": datetime.now().date().isoformat(),
        **metrics
    }
```

## Normalized Data Schema

All sources normalize to this format:

```json
{
  "date": "2026-03-03",
  "source": "oura",
  "sleep": {
    "duration_hours": 7.2,
    "efficiency_pct": 88,
    "deep_pct": 18,
    "rem_pct": 22,
    "light_pct": 55,
    "awake_pct": 5,
    "latency_min": 12,
    "timing": {
      "bedtime": "23:15",
      "wake_time": "06:45"
    }
  },
  "hrv": {
    "rmssd_avg": 45,
    "rmssd_min": 28,
    "rmssd_max": 72
  },
  "resting_hr": 52,
  "respiratory_rate": 14.5,
  "body_temp_deviation": 0.1,
  "activity": {
    "steps": 8420,
    "active_calories": 450,
    "strain_score": 12.4
  },
  "readiness": {
    "score": 78,
    "recovery_index": 75
  }
}
```

## Analysis Engine

### Trend Detection

```python
def detect_trends(data, metric, window=7):
    """
    Detect if metric is improving, declining, or stable
    """
    values = [d[metric] for d in data[-window:]]
    
    # Linear regression
    slope, _, r_value, _, _ = linregress(range(len(values)), values)
    
    if abs(r_value) < 0.3:
        return "stable"
    elif slope > 0:
        return "improving"
    else:
        return "declining"
```

### Correlation Analysis

```python
def find_correlations(wearable_data, habit_data, metric="hrv"):
    """
    Find which habits correlate with metric changes
    """
    correlations = []
    
    for habit in habit_data:
        # Get metric values on days habit was done vs not done
        done_days = [d[metric] for d in wearable_data if habit_completed(habit, d["date"])]
        not_done_days = [d[metric] for d in wearable_data if not habit_completed(habit, d["date"])]
        
        if len(done_days) > 5 and len(not_done_days) > 5:
            # T-test for significance
            stat, p_value = ttest_ind(done_days, not_done_days)
            
            if p_value < 0.05:
                impact = mean(done_days) - mean(not_done_days)
                correlations.append({
                    "habit": habit["name"],
                    "impact": impact,
                    "p_value": p_value,
                    "confidence": "high" if p_value < 0.01 else "medium"
                })
    
    return sorted(correlations, key=lambda x: abs(x["impact"]), reverse=True)
```

### Protocol Matching

```python
def recommend_protocols(user_data, goal, wot_pubkey, relay_urls):
    """
    Fetch protocols from Nostr, filter by WoT, match to user's needs
    """
    # Get user's weak areas
    weaknesses = identify_weaknesses(user_data)
    
    # Fetch protocols from Nostr (kind 38401)
    all_protocols = fetch_protocols_from_nostr(relay_urls)
    
    # Filter by WoT
    trusted_protocols = filter_by_wot(all_protocols, wot_pubkey)
    
    # Score protocols by relevance to user's data
    scored = []
    for protocol in trusted_protocols:
        score = calculate_match_score(protocol, weaknesses, goal)
        
        # Check if user's data suggests this will work for them
        predicted_effectiveness = predict_effectiveness(protocol, user_data)
        
        # Check for contraindications
        contraindications = check_contraindications(protocol, user_data)
        
        if not contraindications:
            scored.append({
                "protocol": protocol,
                "match_score": score,
                "predicted_effectiveness": predicted_effectiveness,
                "wot_rating": get_wot_rating(protocol, wot_pubkey)
            })
    
    return sorted(scored, key=lambda x: x["match_score"], reverse=True)[:5]
```

## Proactive Behaviors

### Morning Briefing

Every morning, the agent can:

```
Good morning! Here's your readiness report:

📊 Readiness: 78 (Good)
💓 HRV: 45ms (above your baseline)
😴 Sleep: 7.2h, 88% efficiency, 18% deep

✅ You're recovered. Good day for intensity.
⚠️ Deep sleep was low (14% vs 20% target).

💡 Recommendation: Try the Temperature Sleep Protocol tonight — 
   4.3★ from 18 people in your network. Your HRV suggests 
   you respond well to temperature interventions.
```

### Training Guidance

```
Your HRV dropped 20% from baseline. 

🔴 Not a good day for HIIT or heavy lifting.
🟢 Good options: Zone 2 cardio, yoga, mobility work

Based on your patterns, you recover faster when you go easy 
on low-HRV days. Last time you pushed through, recovery 
took 3 extra days.
```

### Weekly Analysis

```
📊 Week in Review

HRV: +8% vs last week (trending up!)
Sleep: 6.8h avg (below 7h target)
Deep sleep: 15% (improving from 12%)

🔍 What worked:
- No alcohol days: HRV +15ms
- Morning light protocol: adherence 85%

🔍 What hurt:
- Late meals (3 days): sleep efficiency -12%
- Missed Zone 2 sessions

📋 Suggested focus this week:
1. Prioritize the "Dinner Before 7 PM" habit
2. Add one more Zone 2 session
3. Your network is talking about the "Evening Wind-Down Protocol" — 
   might help your sleep latency
```

## Config

```ini
[wearable-coach]
# Primary data source
primary_source = oura

# API tokens
oura_token = your_oura_pat
whoop_token = your_whoop_token
garmin_oauth = /path/to/garmin_oauth.json

# Nostr for protocol recommendations
nostr_relays = wss://relay.damus.io,wss://nos.lol
nostr_pubkey = npub1...

# Analysis settings
baseline_days = 30
correlation_min_samples = 10
```

## Data Storage

Local data stored in `~/.openclaw/liberture/wearable_data/`:

```
wearable_data/
├── daily/
│   ├── 2026-03-01.json
│   ├── 2026-03-02.json
│   └── 2026-03-03.json
├── analysis/
│   ├── correlations.json
│   ├── baselines.json
│   └── trends.json
└── sync_state.json
```

## Privacy

- All data stored locally
- No cloud sync unless user enables
- Nostr queries don't leak health data
- Protocol recommendations based on patterns, not raw data

## Dependencies

- habit-tracker skill (for correlation analysis)
- protocol-executor skill (for starting recommended protocols)
- Nostr client (for WoT-filtered protocols)
- scipy (for statistical analysis)
- requests (for API calls)
