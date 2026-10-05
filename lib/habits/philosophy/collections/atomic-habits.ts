import type { Collection } from "../types"

/**
 * James Clear is very much alive and his book is very much in print, so this
 * collection is mostly *principles in our own words* attributed to the
 * framework, with only a handful of short, clearly-cited lines. If a passage
 * makes you want the argument in full, the right outcome is that you buy the
 * book — hence the source links.
 */
export const atomicHabits: Collection = {
  id: "atomic-habits",
  name: "Identity & Atomic Habits",
  description:
    "The shift from 'I want to run a marathon' to 'I am a runner'. Small votes, cast daily, for the person you're becoming.",
  pillar: "mind",
  attributionNote:
    "Principles from James Clear's Atomic Habits, restated. Quoted lines are cited; the rest are our paraphrase.",
  quotes: [
    {
      id: "atomic-identity-1",
      kind: "quote",
      collection: "atomic-habits",
      text: "Every action you take is a vote for the type of person you wish to become.",
      author: "James Clear",
      source: "Atomic Habits",
      url: "https://jamesclear.com/atomic-habits",
      application: "Today's rep is one vote. It doesn't have to be a landslide.",
    },
    {
      id: "atomic-identity-2",
      kind: "mantra",
      collection: "atomic-habits",
      text: "You are not trying to reach a number. You are trying to become the kind of person for whom this is simply what they do.",
      author: "Atomic Habits (paraphrased)",
      application: "Say the identity out loud: 'I am someone who trains.' Then do the smallest version.",
    },
    {
      id: "atomic-systems-1",
      kind: "quote",
      collection: "atomic-habits",
      text: "You do not rise to the level of your goals. You fall to the level of your systems.",
      author: "James Clear",
      source: "Atomic Habits",
      url: "https://jamesclear.com/atomic-habits",
      pillars: ["work"],
      application: "If you missed yesterday, fix the system, not the ambition.",
    },
    {
      id: "atomic-compound-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "One per cent better is invisible today and unmistakable in a year. The whole difficulty of this is that the evidence arrives last.",
      author: "Atomic Habits (paraphrased)",
      application: "Judge today by whether you showed up, not by whether you can see progress.",
    },
    {
      id: "atomic-never-twice-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "Never miss twice. One missed day is an accident. Two is the start of a new habit — the one you didn't choose.",
      author: "Atomic Habits (paraphrased)",
      application: "If yesterday was a miss, today is the only day that matters.",
    },
    {
      id: "atomic-environment-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "Motivation is overrated; environment often matters more. Make the good thing obvious and the bad thing invisible, and willpower stops being the deciding factor.",
      author: "Atomic Habits (paraphrased)",
      pillars: ["nutrition", "sleep"],
      application: "Change one object's location today so the right choice is the easy one.",
    },
    {
      id: "atomic-stacking-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "After I [current habit], I will [new habit]. The habit you already have is the most reliable cue you will ever find.",
      author: "Atomic Habits (paraphrased)",
      application: "Attach today's new habit to something you already do without thinking.",
    },
    {
      id: "atomic-plateau-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "The plateau of latent potential: the work accumulates long before the results appear. Most people quit in the gap.",
      author: "Atomic Habits (paraphrased)",
      application: "You are probably further along than the evidence shows.",
    },
    {
      id: "atomic-satisfying-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "What is rewarded is repeated. If a habit never feels good, no amount of discipline will keep it alive.",
      author: "Atomic Habits (paraphrased)",
      application: "Find one thing to genuinely enjoy about today's rep.",
    },
    {
      id: "atomic-scorecard-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "Awareness comes before change. Write down what you actually do for one day, without judging any of it.",
      author: "Atomic Habits (paraphrased)",
      pillars: ["finance", "nutrition"],
    },
    {
      id: "atomic-showup-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "On the days you don't feel like it, the goal is not a good session. The goal is to remain someone who shows up.",
      author: "Atomic Habits (paraphrased)",
      pillars: ["exercise"],
      application: "Two minutes counts. Two minutes protects the identity.",
    },
    {
      id: "atomic-decisive-1",
      kind: "mantra",
      collection: "atomic-habits",
      text: "A few decisive moments each day set the shape of everything after them — the first hour, the first meal, the first screen.",
      author: "Atomic Habits (paraphrased)",
      pillars: ["work", "sleep"],
    },
  ],
}
