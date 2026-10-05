import type { Collection } from "../types"

/**
 * BJ Fogg's Behavior Design, restated. Same approach as the Atomic Habits
 * collection: principles in our own words, short cited lines where the phrasing
 * is the point.
 */
export const tinyHabits: Collection = {
  id: "tiny-habits",
  name: "Tiny Habits",
  description:
    "Make it so small it feels silly. Motivation is unreliable; ability is something you can design.",
  pillar: "mind",
  attributionNote: "Principles from BJ Fogg's Tiny Habits and Behavior Design, restated.",
  quotes: [
    {
      id: "tiny-b-map-1",
      kind: "quote",
      collection: "tiny-habits",
      text: "Behavior happens when Motivation, Ability, and a Prompt come together at the same moment.",
      author: "BJ Fogg",
      source: "Tiny Habits",
      url: "https://tinyhabits.com",
      application: "If a habit failed, one of the three was missing. Work out which.",
    },
    {
      id: "tiny-small-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "Two push-ups. One page. One sentence. Make it small enough that you cannot argue with it, then let it grow on its own.",
      author: "Tiny Habits (paraphrased)",
      application: "Shrink today's habit until refusing it would be absurd.",
    },
    {
      id: "tiny-motivation-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "Motivation is a wave. Design for the trough, not the crest — whatever you build must survive the day you feel like nothing.",
      author: "Tiny Habits (paraphrased)",
    },
    {
      id: "tiny-celebrate-1",
      kind: "quote",
      collection: "tiny-habits",
      text: "Emotions create habits. Not repetition, not frequency, not fairy dust.",
      author: "BJ Fogg",
      source: "Tiny Habits",
      url: "https://tinyhabits.com",
      application: "Celebrate immediately after the behaviour — out loud, however daft it feels.",
    },
    {
      id: "tiny-anchor-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "Anchor the new thing to something already automatic. After I pour my coffee, I will… The anchor does the remembering for you.",
      author: "Tiny Habits (paraphrased)",
    },
    {
      id: "tiny-shame-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "You will not shame yourself into lasting change. People change best by feeling good, not by feeling bad.",
      author: "Tiny Habits (paraphrased)",
      application: "If today's miss came with a lecture, drop the lecture and keep the habit.",
    },
    {
      id: "tiny-maui-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "The Maui habit: after you wake, say 'it's going to be a great day'. Not because it's true, but because of what it does to the next hour.",
      author: "Tiny Habits (paraphrased)",
      pillars: ["mind", "sleep"],
    },
    {
      id: "tiny-ability-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "When a behaviour is hard, you have three levers: more skill, better tools, or a smaller version. The third is almost always the fastest.",
      author: "Tiny Habits (paraphrased)",
      pillars: ["exercise", "work"],
    },
    {
      id: "tiny-scale-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "Start tiny and let it scale itself. A habit that grows because you wanted to is stable; one you forced is not.",
      author: "Tiny Habits (paraphrased)",
    },
    {
      id: "tiny-restart-1",
      kind: "mantra",
      collection: "tiny-habits",
      text: "A broken streak is information, not a verdict. Make the habit smaller and start again today.",
      author: "Tiny Habits (paraphrased)",
    },
  ],
}
