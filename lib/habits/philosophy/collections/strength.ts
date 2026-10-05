import type { Collection } from "../types"

/**
 * Strength as a practice rather than a punishment. Tsatsouline-leaning, with
 * some long-standing gym wisdom that has no single owner.
 */
export const strength: Collection = {
  id: "strength",
  name: "Strength as Practice",
  description:
    "Train the skill, not the fatigue. The best session is the one that lets you train again tomorrow.",
  pillar: "exercise",
  attributionNote: "Principles from Pavel Tsatsouline's writing, restated. Quoted lines are cited.",
  quotes: [
    {
      id: "strength-skill-1",
      kind: "quote",
      collection: "strength",
      text: "Strength is a skill.",
      author: "Pavel Tsatsouline",
      source: "The Naked Warrior",
      url: "https://www.strongfirst.com",
      application: "Practise the movement well today. Don't try to destroy yourself with it.",
    },
    {
      id: "strength-failure-1",
      kind: "mantra",
      collection: "strength",
      text: "Never to failure. Every rep should look like the first one. When form starts to fray, the useful part of the set is already over.",
      author: "Grease the Groove (paraphrased)",
      application: "Stop the set while it still feels easy. That is the protocol, not a compromise.",
    },
    {
      id: "strength-frequency-1",
      kind: "mantra",
      collection: "strength",
      text: "Frequency beats intensity for skill. Many fresh, crisp sets across a week teach your nervous system more than one heroic session that costs three days of recovery.",
      author: "Grease the Groove (paraphrased)",
    },
    {
      id: "strength-greasing-1",
      kind: "quote",
      collection: "strength",
      text: "Specificity plus frequent practice equals success.",
      author: "Pavel Tsatsouline",
      source: "The Naked Warrior",
      url: "https://www.strongfirst.com",
    },
    {
      id: "strength-ego-1",
      kind: "mantra",
      collection: "strength",
      text: "The failure mode is always ego. If today's set felt hard, you did too many — not too few.",
      author: "Grease the Groove (paraphrased)",
    },
    {
      id: "strength-tendon-1",
      kind: "mantra",
      collection: "strength",
      text: "Muscle adapts in weeks; tendon and connective tissue take months. Add volume slower than you feel able to.",
      author: "Strength training consensus",
    },
    {
      id: "strength-longevity-1",
      kind: "mantra",
      collection: "strength",
      text: "Train for the last decade of your life, not the next photograph. Strength and stability are what decide whether that decade is yours.",
      author: "Centenarian Decathlon (paraphrased)",
      application: "Ask what you want to physically be able to do at eighty, then train that.",
    },
    {
      id: "strength-consistency-1",
      kind: "mantra",
      collection: "strength",
      text: "The best programme is the one you are still running in a year. Everything else is a rounding error.",
      author: "Strength training consensus",
    },
    {
      id: "strength-walk-1",
      kind: "mantra",
      collection: "strength",
      text: "Walking is the floor, not the consolation prize. It is free, it is joint-friendly, and it is the intervention with the least excuse attached.",
      author: "Physical activity guidelines (paraphrased)",
    },
    {
      id: "strength-recovery-1",
      kind: "mantra",
      collection: "strength",
      text: "You do not grow during the session. You grow during the sleep that follows it.",
      author: "Strength training consensus",
      pillars: ["exercise", "sleep"],
    },
  ],
}
