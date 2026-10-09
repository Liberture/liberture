/**
 * MCP prompts: ready-made conversations a client can offer as shortcuts
 * ("/morning_checkin"). Each is one user message telling the model which
 * tools to call and how to answer, written for voice: short, one call at a
 * time, read back the `say` sentences.
 */

export interface McpPromptArgument {
  name: string
  description: string
  required: boolean
}

export interface McpPrompt {
  name: string
  title: string
  description: string
  arguments: McpPromptArgument[]
}

interface PromptDefinition extends McpPrompt {
  text: (args: Record<string, string>) => string
}

const KEEP_IT_SHORT = "Keep every reply to one or two sentences; I may be listening, not reading."

const DEFINITIONS: PromptDefinition[] = [
  {
    name: "morning_checkin",
    title: "Morning check-in",
    description: "What's on today: habits, events and urgent todos, then start the first habit.",
    arguments: [],
    text: () =>
      "Run my morning check-in. Call get_today, then get_agenda with days=1. Tell me what's on today: habits still to do with their times, " +
      "events, and any overdue or due-today todos, and name one streak worth protecting. Then ask which habit I'll start with, and log it " +
      `with log_habit when I say I did it. ${KEEP_IT_SHORT}`,
  },
  {
    name: "evening_review",
    title: "Evening review",
    description: "Close the day: what got done, log what's missing, move what can't happen.",
    arguments: [],
    text: () =>
      "Review my day. Call get_today and get_audit. Say what I did and what's still open. For each open habit, ask if I did it and log " +
      "my answers with log_habit (pass a note if I say how it went; amounts go through log_habit_value). If a todo can't happen today, " +
      `offer to move it with update_todo. End with one encouraging line. ${KEEP_IT_SHORT}`,
  },
  {
    name: "weekly_review",
    title: "Weekly review",
    description: "The week in numbers, the best and weakest habit, and one small change.",
    arguments: [{ name: "habit", description: "Optional: one habit to look at closely.", required: false }],
    text: (args) =>
      "Review my week. Call get_stats and list_habits" +
      (args.habit ? `, and get_habit_history for "${args.habit}" with days=7` : "") +
      ". Tell me the 7-day completion rate, my strongest and weakest habit, and a streak to celebrate. Suggest one small change " +
      "(a better time, fewer days, or archiving a habit I keep skipping) and make it with update_habit or archive_habit only after I " +
      `agree. ${KEEP_IT_SHORT}`,
  },
  {
    name: "plan_my_day",
    title: "Plan my day",
    description: "A simple plan: habits at their times, events fixed, top todos in the gaps.",
    arguments: [],
    text: () =>
      "Plan my day. Call get_today, get_agenda with days=1, and list_todos with status=pending and sort=deadline. Propose a simple " +
      "plan: habits at their times, events where they are, and the two or three most important todos in the free time. When I agree, " +
      `block the todos with schedule_todo (local times are fine). ${KEEP_IT_SHORT}`,
  },
  {
    name: "pick_a_protocol",
    title: "Pick a protocol",
    description: "Find a catalog protocol that fits a goal, and add it if wanted.",
    arguments: [
      { name: "goal", description: "What to improve, e.g. \"sleep better\" or \"more focus\".", required: false },
      { name: "pillar", description: "Optional area: work, sleep, nutrition, mind, exercise or finance.", required: false },
    ],
    text: (args) =>
      `Help me pick a protocol${args.goal ? ` to ${args.goal}` : ""}. Call get_profile to see my focus, then search_catalog` +
      (args.goal ? ` with q="${args.goal}"` : "") +
      (args.pillar ? ` and pillar=${args.pillar}` : "") +
      ". Suggest at most three I haven't adopted, one line each on why it fits, with its infoUrl. If I pick one, add it with adopt_habit. " +
      KEEP_IT_SHORT,
  },
  {
    name: "coach_checkin",
    title: "Coach check-in",
    description: "A proactive check-in that respects the user's quiet hours and daily limit. For scheduled tasks and automations.",
    arguments: [
      {
        name: "kind",
        description: "morning, afternoon, evening, weekly or missed_logging. Default: whichever fits the time of day.",
        required: false,
      },
    ],
    text: (args) =>
      `Run a coach check-in${args.kind ? ` (kind ${args.kind})` : ""}. First call get_coach_state. Then call record_coach_nudge ` +
      `with kind=${args.kind ?? "the one that fits the time of day"} and the message you plan to send. If it returns allowed: false, ` +
      "stop and send nothing. Otherwise write one short message: morning = two priorities and a first step (use get_today); " +
      "afternoon = the next thing still worth doing; weekly = what worked, where it slipped, and one change phrased as a " +
      "proposal; missed_logging = ask whether the habits with unloggedDueDays ≥ 3 were skipped or just not logged — not logged " +
      "is not the same as not done. Never change anything without my answer. If a suggestion comes up and I decline or want it " +
      `later, record it with respond_to_suggestion. ${KEEP_IT_SHORT}`,
  },
]

export const MCP_PROMPTS: McpPrompt[] = DEFINITIONS.map(({ name, title, description, arguments: args }) => ({ name, title, description, arguments: args }))

export function getPrompt(name: string, args: Record<string, unknown>) {
  const definition = DEFINITIONS.find((p) => p.name === name)
  if (!definition) return null
  const clean: Record<string, string> = {}
  for (const arg of definition.arguments) {
    const value = args[arg.name]
    if (typeof value === "string" && value.trim()) clean[arg.name] = value.trim().slice(0, 200)
  }
  return {
    description: definition.description,
    messages: [{ role: "user" as const, content: { type: "text" as const, text: definition.text(clean) } }],
  }
}
