---
name: habit-tracker
description: "Interact with the user's Habit Tracker app (habit stats, streaks, completions, charts). Use when the user asks about their habits, streaks, completion rates, wants to log a habit completion, or wants a chart/image of their habit stats. Requires HABIT_TRACKER_URL and HABIT_TRACKER_TOKEN to be configured."
---

# Habit Tracker Skill

Connects Topolino to Fabri's habit tracker via its v1 REST API.

## Config

Two env vars (or set in `~/.openclaw/habit-tracker.conf`):
```
HABIT_TRACKER_URL=https://your-app.vercel.app
HABIT_TRACKER_TOKEN=hti_xxxxxxxxxxxxxxxxxxxxxx
```

To get a token: open the habit tracker app → Settings → OpenClaw Integration → Generate Token.

Read config with:
```python
import os, configparser

def get_config():
    url = os.environ.get("HABIT_TRACKER_URL")
    token = os.environ.get("HABIT_TRACKER_TOKEN")
    if not url or not token:
        conf = configparser.ConfigParser()
        conf.read(os.path.expanduser("~/.openclaw/habit-tracker.conf"))
        url = url or conf.get("habit-tracker", "url", fallback=None)
        token = token or conf.get("habit-tracker", "token", fallback=None)
    return url, token
```

## API

All requests: `Authorization: Bearer <HABIT_TRACKER_TOKEN>`

See `references/api.md` for full docs. Quick reference:

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/habits | List habits + stats |
| GET | /api/v1/stats | Overall stats + completionsByDay |
| GET | /api/v1/completions?days=N | Recent completions |
| POST | /api/v1/completions | Log a completion |

## Common Patterns

### "How are my habits?"
```python
import requests
url, token = get_config()
headers = {"Authorization": f"Bearer {token}"}
stats = requests.get(f"{url}/api/v1/stats", headers=headers).json()
habits = requests.get(f"{url}/api/v1/habits", headers=headers).json()
# Summarize: completion rate, best streak, completed today count
```

### "Show me my habit chart"
```python
import subprocess, json, tempfile, os

url, token = get_config()
headers = {"Authorization": f"Bearer {token}"}
stats = requests.get(f"{url}/api/v1/stats", headers=headers).json()
habits = requests.get(f"{url}/api/v1/habits", headers=headers).json()

data = json.dumps({"stats": stats, "habits": habits})
skill_dir = os.path.dirname(os.path.abspath(__file__))
chart_script = os.path.join(skill_dir, "scripts", "chart.py")

with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
    chart_path = f.name

subprocess.run(
    ["python3", chart_script, "--output", chart_path, "--json", data],
    check=True
)
# Then send chart_path as image via message tool
```

After generating the chart, use the `message` tool with `media=chart_path` to send the image to Telegram.

### "I just did [habit name]"
```python
habits = requests.get(f"{url}/api/v1/habits", headers=headers).json()
# Find matching habit by name (fuzzy match)
match = next((h for h in habits if habit_name.lower() in h["name"].lower()), None)
if match:
    result = requests.post(
        f"{url}/api/v1/completions",
        headers={**headers, "Content-Type": "application/json"},
        json={"habitId": match["id"]}
    ).json()
    # Report new streak
```

## Chart Script

Located at `scripts/chart.py`. Requires matplotlib (installed via apt: `python3-matplotlib`).

```bash
python3 scripts/chart.py --output /tmp/habits.png --json '{"stats": {...}, "habits": [...]}'
python3 scripts/chart.py --output /tmp/habits.png < data.json
```

Chart includes: completion heatmap (30 days), per-habit bar chart (7-day rates), header with key stats.
