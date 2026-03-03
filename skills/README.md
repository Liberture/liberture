# Liberture Skills

OpenClaw-compatible skills for human performance, organized by pillar.

## What's a Skill?

A skill is a packaged capability that an OpenClaw agent can use. It has:
- **SKILL.md** — Interface spec (description, inputs, outputs, examples)
- **Implementation** — The actual code (JS, Python, shell, etc.)
- **README.md** — Human-friendly documentation

## Pillars

| Pillar | Icon | Focus |
|--------|------|-------|
| Cognition | 🧠 | Focus, learning, productivity |
| Recovery | 😴 | Sleep, rest, restoration |
| Fueling | 🥗 | Nutrition, fasting, hydration |
| Mental | 🧘 | Stress, meditation, habits |
| Physicality | 🏋️ | Strength, cardio, mobility |
| Finance | 💰 | Savings, investing, independence |

## Available Skills

| Skill | Pillar | Description |
|-------|--------|-------------|
| [habit-tracker](./habit-tracker/) | 🧘 Mental | Track habits, log completions, generate charts |

### Coming Soon

- Sleep cycle calculator (😴 Recovery)
- Macro calculator (🥗 Fueling)
- Breathing timer (🧘 Mental)
- 1RM calculator (🏋️ Physicality)
- FIRE calculator (💰 Finance)

## Using a Skill

```bash
# Copy to your OpenClaw skills directory
cp -r liberture/skills/habit-tracker ~/.openclaw/skills/

# Or symlink the whole library
ln -s /path/to/liberture/skills ~/.openclaw/liberture-skills
```

Your agent reads SKILL.md, understands the interface, and can call the tool.

## Creating a Skill

1. Copy `_template/` to a new folder
2. Fill in SKILL.md with your interface spec
3. Implement the logic
4. Test with your own agent
5. Submit a PR

See [_template/SKILL.md](./_template/SKILL.md) for the required format.

## Contributing

We welcome community skills! Requirements:
- Must fit one of the 6 pillars
- Must follow the SKILL.md format
- Must include working implementation
- Must include at least one example

Open a PR to `liberture/liberture` with your skill in the `/skills` folder.
