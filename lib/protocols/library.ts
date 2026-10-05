/**
 * Cross-links between protocols (synergy / alternative), seeded into
 * ProtocolRelation by scripts/seed-marketplace-protocols.ts.
 *
 * The protocols themselves now live in the habit tracker's library
 * (lib/habits/protocols/library); every slug below exists there.
 */

export type SeedRelation = {
  from: string
  to: string
  kind: "synergy" | "alternative"
  note: string
}

export const relations: SeedRelation[] = [
  {
    from: "deep-work-blocks",
    to: "pomodoro-method",
    kind: "alternative",
    note: "Same subject — focused work — different containers. Pomodoro's 25-minute sprints suit fragmented days and shallow-to-medium tasks; 90-minute blocks suit long, cognitively demanding projects. A common path: build the focus muscle on Pomodoro, then graduate to blocks.",
  },
  {
    from: "daily-mindfulness-meditation",
    to: "deep-work-blocks",
    kind: "synergy",
    note: "Meditation trains exactly the move deep work depends on: noticing your attention drifted and returning it. Ten minutes on the cushion is rep training for every wander during a work block.",
  },
  {
    from: "morning-sunlight-exposure",
    to: "caffeine-cutoff",
    kind: "synergy",
    note: "They attack sleep from opposite ends of the day: morning light anchors the circadian clock, the cutoff protects nighttime adenosine buildup. Together they cover the full 24-hour cycle — a strong minimal sleep stack.",
  },
  {
    from: "morning-sunlight-exposure",
    to: "daily-walking-baseline",
    kind: "synergy",
    note: "Take the morning walk outdoors and both protocols complete in a single habit — the light sets your clock while ~2-3k steps bank toward the daily floor.",
  },
  {
    from: "time-restricted-eating",
    to: "protein-first-breakfast",
    kind: "synergy",
    note: "They can conflict if 16:8 means skipping breakfast — resolve it by opening the eating window with the 30-40g-protein meal. You keep the compressed window AND the morning protein stimulus.",
  },
  {
    from: "protein-first-breakfast",
    to: "resistance-training-basics",
    kind: "synergy",
    note: "Training provides the muscle-protein-synthesis stimulus; distributed protein provides the substrate. Each roughly doubles the return on the other — this is the classic body-composition pairing.",
  },
  {
    from: "daily-walking-baseline",
    to: "resistance-training-basics",
    kind: "synergy",
    note: "Walking builds the aerobic floor, lifting preserves muscle and bone — they cover different systems with almost no overlap. Steps daily + two lifts a week is a complete minimalist week of training.",
  },
  {
    from: "daily-mindfulness-meditation",
    to: "gratitude-journaling",
    kind: "synergy",
    note: "Different mechanisms, same direction: meditation trains in-the-moment attention regulation; gratitude retrains what memory retrieves afterward. Five minutes each covers both angles of mental fitness.",
  },
  {
    from: "pay-yourself-first",
    to: "weekly-money-review",
    kind: "synergy",
    note: "Automation handles the saving; the review catches what automation can't see — subscription creep, drift, upcoming irregular expenses — and tells you when the automated rate is ready to ratchet up.",
  },
  {
    from: "caffeine-cutoff",
    to: "time-restricted-eating",
    kind: "synergy",
    note: "The eating window naturally bounds caffeine too: close the window by mid-afternoon and the caffeine cutoff happens for free. One schedule, two protocols satisfied.",
  },
  // Relations to pre-existing library protocols (skipped automatically if absent)
  {
    from: "morning-sunlight-exposure",
    to: "huberman-sleep-protocol",
    kind: "alternative",
    note: "Morning light is the first and highest-leverage pillar of the full Huberman sleep protocol. Start here if the complete 7-habit protocol feels like too much; graduate to the full stack once this is automatic.",
  },
  {
    from: "resistance-training-basics",
    to: "zone-2-training",
    kind: "synergy",
    note: "Strength and aerobic base are complementary adaptations — lifting doesn't build mitochondria, cardio doesn't preserve muscle. Two lifts plus two or three zone-2 sessions is a complete training week.",
  },
  {
    from: "daily-walking-baseline",
    to: "zone-2-training",
    kind: "alternative",
    note: "Both build aerobic health. Walking is the floor: free, joint-friendly, no scheduling. Zone 2 is the structured upgrade when you want measurable cardiovascular adaptation. Start with steps; add zone 2 when you want more.",
  },
]

