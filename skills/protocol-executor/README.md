# Protocol Executor Skill

**Pillar:** All  
**Author:** @liberture  
**Version:** 1.0.0  
**Depends on:** habit-tracker

## What it does

Turns health protocols into daily habits you can actually track.

Instead of reading a protocol and trying to remember it, the Protocol Executor:
1. Breaks it into specific actions
2. Creates habits in your tracker
3. Reminds you at the right times
4. Tracks your adherence
5. Reports your progress

## Quick start

1. Make sure habit-tracker skill is configured
2. Copy this skill to your OpenClaw skills folder:
```bash
cp -r protocol-executor ~/.openclaw/skills/
```

## Usage examples

**Start a protocol:**
> "Start the Huberman sleep protocol"  
> "I want to try the 5-3-1 strength protocol"

**Check progress:**
> "How am I doing on my sleep protocol?"  
> "What's my adherence this week?"

**Manage protocols:**
> "Pause my fasting protocol for the holidays"  
> "Stop the cold exposure protocol"  
> "What protocols am I running?"

**From Nostr:**
> "Start the sleep protocol that @huberman posted"  
> "Find a beginner meditation protocol from my network"

## How it works

```
Protocol → Actions → Habits → Daily Tracking → Progress Reports
    ↓
  Nostr    Your agent parses    Created in     Habit tracker    Weekly
  event    into steps           tracker        logs them        summaries
```

## Example protocol

```json
{
  "name": "Huberman Sleep Protocol",
  "pillar": "recovery",
  "actions": [
    {
      "name": "Morning sunlight (10 min)",
      "time": "morning",
      "description": "Direct sun within 30 min of waking"
    },
    {
      "name": "Dim lights after sunset",
      "time": "evening"
    },
    {
      "name": "No screens 1hr before bed",
      "time": "night"
    }
  ]
}
```

When you start this, you get 3 new habits in your tracker, tagged with `protocol:huberman-sleep`.

## Proactive features

Your agent will:
- Morning check-in with today's protocol actions
- Contextual reminders (sunset → dim lights)
- Weekly adherence summaries
- Streak celebrations
- Detect when you're struggling and offer adjustments

## Dependencies

- habit-tracker skill (required)
- Nostr client (optional, for fetching protocols)

## State

Protocol state stored in `~/.openclaw/liberture/protocols.json`
