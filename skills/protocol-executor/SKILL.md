---
name: protocol-executor
description: "Execute health protocols by converting them into trackable daily actions. Integrates with habit-tracker skill. Use when the user wants to start a protocol, track protocol adherence, or get reminders for protocol steps."
---

# Protocol Executor Skill

Turns protocols into actionable daily habits and tracks adherence.

**Pillar:** All (depends on protocol)  
**Author:** @liberture  
**Version:** 1.0.0  
**Depends on:** habit-tracker

## What It Does

1. **Parse** — Takes a protocol (Nostr event or manual input) and extracts actions
2. **Schedule** — Creates habits in the habit tracker for each action
3. **Remind** — Sends contextual reminders at appropriate times
4. **Track** — Monitors adherence and reports progress
5. **Adapt** — Adjusts based on user feedback

## Interface

### Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | yes | `start`, `status`, `pause`, `resume`, `stop`, `list` |
| `protocol` | object | for start | Protocol definition (see below) |
| `protocol_id` | string | for status/pause/resume/stop | Active protocol ID |
| `nostr_event` | string | optional | Nostr event ID to fetch protocol from |

### Protocol Object

```json
{
  "id": "huberman-sleep",
  "name": "Huberman Sleep Protocol",
  "pillar": "recovery",
  "duration": "ongoing",
  "actions": [
    {
      "id": "morning-light",
      "name": "Morning sunlight (10 min)",
      "time": "morning",
      "time_relative": "+30m from wake",
      "description": "Get direct sunlight exposure within 30 minutes of waking. No sunglasses.",
      "frequency": "daily"
    },
    {
      "id": "evening-dim",
      "name": "Dim lights after sunset",
      "time": "evening",
      "time_trigger": "sunset",
      "description": "Reduce overhead lights, use lamps, enable night mode on screens.",
      "frequency": "daily"
    },
    {
      "id": "no-screens",
      "name": "No screens 1hr before bed",
      "time": "night",
      "time_relative": "-60m from sleep",
      "description": "Put away phone/laptop. Read physical book or do relaxation.",
      "frequency": "daily"
    }
  ],
  "source": "https://hubermanlab.com/...",
  "studies": ["doi:10.1234/sleep.2023.001"]
}
```

### Outputs

#### start

```json
{
  "success": true,
  "protocol_id": "huberman-sleep",
  "habits_created": [
    {"id": "habit-123", "name": "Morning sunlight (10 min)"},
    {"id": "habit-124", "name": "Dim lights after sunset"},
    {"id": "habit-125", "name": "No screens 1hr before bed"}
  ],
  "start_date": "2026-03-03",
  "message": "Protocol started! 3 habits created. I'll remind you at the right times."
}
```

#### status

```json
{
  "protocol_id": "huberman-sleep",
  "protocol_name": "Huberman Sleep Protocol",
  "day": 5,
  "adherence_rate": 0.73,
  "today": {
    "completed": ["morning-light"],
    "pending": ["evening-dim", "no-screens"],
    "missed": []
  },
  "streak": {
    "current": 3,
    "best": 4
  },
  "actions": [
    {"id": "morning-light", "rate_7d": 0.86, "rate_total": 0.80},
    {"id": "evening-dim", "rate_7d": 0.71, "rate_total": 0.60},
    {"id": "no-screens", "rate_7d": 0.57, "rate_total": 0.60}
  ]
}
```

#### list

```json
{
  "active_protocols": [
    {
      "id": "huberman-sleep",
      "name": "Huberman Sleep Protocol",
      "started": "2026-02-27",
      "day": 5,
      "adherence_rate": 0.73
    }
  ],
  "paused_protocols": [],
  "completed_protocols": []
}
```

## Config

Uses habit-tracker config (same URL and token):
```
HABIT_TRACKER_URL=https://your-app.vercel.app
HABIT_TRACKER_TOKEN=hti_xxxxxxxxxxxxxxxxxxxxxx
```

## Implementation

### Starting a Protocol

```python
import requests
import json
from datetime import datetime

def start_protocol(protocol, habit_tracker_url, token):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    created_habits = []
    
    for action in protocol["actions"]:
        # Create habit in tracker
        habit_data = {
            "name": action["name"],
            "category": protocol["pillar"],
            "timeOfDay": action["time"],
            "tags": [f"protocol:{protocol['id']}", protocol["pillar"]],
            "schedule": {"type": action.get("frequency", "daily")}
        }
        
        response = requests.post(
            f"{habit_tracker_url}/api/v1/habits",
            headers=headers,
            json=habit_data
        )
        
        if response.ok:
            habit = response.json()
            created_habits.append({
                "id": habit["id"],
                "name": action["name"],
                "action_id": action["id"]
            })
    
    # Store protocol state
    protocol_state = {
        "id": protocol["id"],
        "name": protocol["name"],
        "started": datetime.now().isoformat(),
        "habits": created_habits,
        "status": "active"
    }
    
    save_protocol_state(protocol_state)
    
    return {
        "success": True,
        "protocol_id": protocol["id"],
        "habits_created": created_habits,
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "message": f"Protocol started! {len(created_habits)} habits created."
    }
```

### Checking Status

```python
def get_protocol_status(protocol_id, habit_tracker_url, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Load protocol state
    protocol = load_protocol_state(protocol_id)
    
    # Get habit stats from tracker
    habits_response = requests.get(
        f"{habit_tracker_url}/api/v1/habits",
        headers=headers
    )
    habits = habits_response.json()
    
    # Filter to protocol habits
    protocol_habit_ids = [h["id"] for h in protocol["habits"]]
    protocol_habits = [h for h in habits if h["id"] in protocol_habit_ids]
    
    # Calculate adherence
    total_rate = sum(h["completionRate7d"] for h in protocol_habits) / len(protocol_habits)
    
    # Today's status
    today_completed = [h["name"] for h in protocol_habits if h["completedToday"]]
    today_pending = [h["name"] for h in protocol_habits if not h["completedToday"]]
    
    # Days since start
    start_date = datetime.fromisoformat(protocol["started"])
    days = (datetime.now() - start_date).days + 1
    
    return {
        "protocol_id": protocol_id,
        "protocol_name": protocol["name"],
        "day": days,
        "adherence_rate": round(total_rate, 2),
        "today": {
            "completed": today_completed,
            "pending": today_pending
        },
        "actions": [
            {
                "id": h["id"],
                "name": h["name"],
                "rate_7d": h["completionRate7d"],
                "completed_today": h["completedToday"]
            }
            for h in protocol_habits
        ]
    }
```

### Fetching from Nostr

```python
import json

def fetch_protocol_from_nostr(event_id, relay_url="wss://relay.damus.io"):
    """
    Fetch a protocol definition from Nostr (kind 38401)
    """
    # Use nostr-tools or similar to fetch event
    # Parse tags into protocol structure
    
    event = fetch_nostr_event(event_id, relay_url)
    
    if event["kind"] != 38401:
        raise ValueError("Not a protocol event")
    
    tags = {t[0]: t[1] for t in event["tags"] if len(t) >= 2}
    
    protocol = {
        "id": tags.get("d"),
        "name": tags.get("title"),
        "pillar": tags.get("pillar"),
        "source": tags.get("source"),
        "studies": [t[1] for t in event["tags"] if t[0] == "study"],
        "content": event["content"]
    }
    
    # Parse actions from content (markdown structure)
    protocol["actions"] = parse_actions_from_content(event["content"])
    
    return protocol
```

## Usage Patterns

### "Start the Huberman sleep protocol"

```python
protocol = {
    "id": "huberman-sleep",
    "name": "Huberman Sleep Protocol",
    "pillar": "recovery",
    "actions": [
        {"id": "morning-light", "name": "Morning sunlight (10 min)", "time": "morning"},
        {"id": "evening-dim", "name": "Dim lights after sunset", "time": "evening"},
        {"id": "no-screens", "name": "No screens 1hr before bed", "time": "night"}
    ]
}

result = start_protocol(protocol, url, token)
# "Protocol started! 3 habits created. I'll remind you at the right times."
```

### "How am I doing on my sleep protocol?"

```python
status = get_protocol_status("huberman-sleep", url, token)
# "Day 5 of Huberman Sleep Protocol. 73% adherence.
#  Today: ✓ Morning sunlight, ○ Dim lights, ○ No screens"
```

### "Start this protocol from Nostr"

```python
protocol = fetch_protocol_from_nostr("nevent1...")
result = start_protocol(protocol, url, token)
```

## Proactive Behaviors

The agent should:

1. **Morning check-in** — "Day 5 of your sleep protocol. Morning sunlight is due!"
2. **Evening reminder** — "Sunset was 30 minutes ago. Time to dim the lights."
3. **Weekly summary** — "Sleep protocol week 1: 73% adherence. Evening routines need work."
4. **Streak alerts** — "3-day streak on morning sunlight! Keep it up."
5. **Struggling detection** — "You've missed 'no screens' 4 days in a row. Want to adjust the protocol?"

## State Storage

Protocol state stored in `~/.openclaw/liberture/protocols.json`:

```json
{
  "active": {
    "huberman-sleep": {
      "id": "huberman-sleep",
      "name": "Huberman Sleep Protocol",
      "started": "2026-02-27T10:00:00Z",
      "habits": [
        {"id": "habit-123", "action_id": "morning-light"},
        {"id": "habit-124", "action_id": "evening-dim"}
      ],
      "nostr_event": "nevent1...",
      "status": "active"
    }
  },
  "paused": {},
  "completed": {}
}
```

## Notes

- Creates real habits in the tracker, not separate tracking
- Tags habits with `protocol:<id>` for filtering
- Supports multiple concurrent protocols
- Can pause/resume without losing history
- Fetches protocols from Nostr for WoT-backed recommendations
