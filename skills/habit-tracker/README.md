# Habit Tracker Skill

**Pillar:** 🧘 Mental  
**Author:** @topolino-claw  
**Version:** 1.0.0

## What it does

Connects your OpenClaw agent to a habit tracking app. Your agent can:
- Check your habit stats and streaks
- Log habit completions ("I just meditated")
- Generate visual charts of your progress

## Quick start

1. Copy to your skills folder:
```bash
cp -r habit-tracker ~/.openclaw/skills/
```

2. Configure credentials:
```bash
# Create config file
cat > ~/.openclaw/habit-tracker.conf << EOF
[habit-tracker]
url = https://your-habit-app.vercel.app
token = hti_your_token_here
EOF
```

3. Get your token from the habit tracker app: Settings → OpenClaw Integration → Generate Token

## Usage examples

**Check habits:**
> "How are my habits doing?"  
> "What's my current streak on meditation?"

**Log completion:**
> "I just did my morning run"  
> "Log my reading habit for today"

**Get visual:**
> "Show me my habit chart"  
> "Generate a progress report"

## Dependencies

- Python 3.10+
- `python3-matplotlib` (for charts)
- `requests` library

## Compatible apps

Built for [tasks.fabri.lat](https://tasks.fabri.lat) but works with any app implementing the v1 API spec in `references/api.md`.
