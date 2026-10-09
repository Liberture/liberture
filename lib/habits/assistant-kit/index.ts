import { createZip } from "@/lib/habits/zip"
import { habitsScript } from "./habits-script"

/**
 * The Claude skill download: SKILL.md plus a stdlib-only script. The personal
 * copy (Settings → Voice assistants → Download Claude skill) carries its own
 * permanent connection token; the generic one reads it from the environment.
 */

export interface KitConfig {
  baseUrl: string
  /** Null builds the generic skill, which reads the token from the environment. */
  token: string | null
}

// ---------------------------------------------------------------- contents

function connectorUrl(config: KitConfig): string {
  return `${config.baseUrl}/mcp`
}

export function skillMarkdown(config: KitConfig): string {
  const personal = Boolean(config.token)
  return `---
name: liberture-habits
description: Check in on the user's Liberture tracker — what's left today, streaks, logging a habit done or undone, todos, weekly stats, and habit or protocol recommendations with links. Use whenever the user mentions their habits, streaks, routine, todos in the tracker, or asks what to try next.
---

# Liberture

${personal ? "This skill is already connected to the user's tracker" : "This skill talks to a Liberture tracker"} at ${config.baseUrl}.

## How to reach the tracker

Use whichever is available, in this order:

1. **The "Liberture" connector**, if its tools are present
   (\`get_today\`, \`log_habit\`, …). Preferred: fastest, and works in voice mode.
2. **The bundled script**, through code execution:
   \`python3 scripts/habits.py <command>\`. ${personal ? "It already contains the URL and the user's token." : "Set LIBERTURE_HABITS_TOKEN first (Settings → Voice assistants in the app)."}
   If it says it can't reach the site, ask the user to allow the domain
   \`${config.baseUrl.replace(/^https?:\/\//, "")}\` for code execution in Claude's Settings → Capabilities.

| Need | Connector tool | Script |
|---|---|---|
| Start: date, user, today, urgent todos | \`get_today\` | \`today\` |
| Mark done / undo (by name) | \`log_habit\` | \`log "walk"\` / \`log "walk" --undo\` / \`--date YYYY-MM-DD\` |
| New habit (any, e.g. running) | \`create_habit\` | \`create "Running" [--days mon,wed,fri] [--time 07:00]\` |
| Add a todo | \`add_todo\` | \`add-todo "Call the bank" --due YYYY-MM-DD\` |
| Finish a todo (by name) | \`set_todo_status\` | \`done-todo "bank"\` |
| All open todos | \`list_todos\` | \`todos\` |
| Week / month numbers | \`get_stats\` | \`stats\` |
| Per-habit history and rates | \`list_habits\` | \`habits\` |
| Find something to try | \`search_catalog\` | \`search "sleep" [--pillar sleep]\` |
| Add a catalog protocol / habit | \`adopt_habit\` | \`adopt <slug>\` / \`adopt <slug> --habit\` |
| Coach's last suggestions | \`get_recommendations\` | \`recommendations\` |

The connector also has tools the script doesn't: \`log_habit_value\` (log an
amount or a note), \`get_habit\` / \`get_habit_history\`, \`archive_habit\` /
\`unarchive_habit\`, \`update_todo\` / \`delete_todo\` / \`schedule_todo\`,
projects (\`list_projects\`, \`create_project\`, …), calendar (\`get_agenda\`,
\`list_events\`, \`create_event\`, \`update_event\`, \`delete_event\`) and
\`get_profile\` / \`update_profile\`. They all take names, like the rest.

## Be fast — this is usually voice

- **One call to start:** \`get_today\`. It already has the date, the user's
  name, what's switched off, today's habits with streaks, and urgent todos.
- **One call to act.** Logging, creating and finishing take names exactly as
  the user said them ("the walk", "meditación"). Never list habits or todos first.
- **Don't ask what a default answers.** A new habit is every day with no
  reminder. Create it, read back the result, offer to change it:
  "Added Running, every day, no reminder. Want a time?"
- **Read back \`say\`.** Every write returns a ready sentence; use it instead
  of composing one. Keep replies to one or two sentences, in the user's language.
- Don't read ids, URLs or JSON aloud; say you've sent the link.
- Only log what the user says they did. "Yesterday" means the day before the
  date at the top of \`get_today\`; pass it as \`date\`.
- If a write returns \`ambiguous\`, ask which of \`options\`. If logging returns
  \`not_found\`, offer to create the habit.

## Recommending

- Recommend only from the catalog search or the coach's suggestions; never invent protocols.
- Skip anything marked \`adopted: true\`.
- Always share \`infoUrl\`: the protocol's page on Liberture.
- Add something only when the user clearly asks you to.

## Permissions

The user can switch actions off in the app (Settings → Voice assistants).
A refused action returns \`scope_disabled\` with a \`message\`: tell the user
that message, don't retry, don't work around it. If adding habits is off, give
them the \`infoUrl\` so they can add it themselves.

A 401 means this skill was disconnected: ask the user to download a fresh one
from Liberture → Settings → Voice assistants.
`
}

function claudeReadme(config: KitConfig): string {
  return `# Liberture for Claude

Upload this zip as-is: Claude → Settings → Capabilities → Skills → Upload skill.
Code execution must be on. If Claude says it can't reach the site, add
${config.baseUrl.replace(/^https?:\/\//, "")} to the allowed domains on that same page.

For voice mode, also add the connector (one paste, then sign in and approve):
Settings → Connectors → Add custom connector → name "Liberture", URL:

    ${connectorUrl(config)}

This skill contains its own access key. Treat the zip like a password. To cut
it off, disconnect "Claude skill" in Liberture → Settings → Voice assistants.
`
}

export function buildClaudeSkillZip(config: KitConfig): Buffer {
  const files = [
    { name: "liberture-habits/SKILL.md", data: skillMarkdown(config) },
    { name: "liberture-habits/scripts/habits.py", data: habitsScript(config), mode: 0o755 },
  ]
  if (config.token) files.push({ name: "liberture-habits/README.md", data: claudeReadme(config) })
  return createZip(files)
}
