import type { Collection } from "../types"

/**
 * Sleep and circadian principles, restated from Walker and Huberman. Short and
 * practical — this collection exists mainly to be read at bedtime, so nothing
 * here is longer than a few lines.
 */
export const sleepWisdom: Collection = {
  id: "sleep-wisdom",
  name: "Sleep & Circadian",
  description:
    "The one lever that improves every other pillar. Regularity first, temperature second, light third.",
  pillar: "sleep",
  attributionNote:
    "Principles from Matthew Walker's Why We Sleep and Andrew Huberman's circadian protocols, restated.",
  quotes: [
    {
      id: "sleep-regularity-1",
      kind: "quote",
      collection: "sleep-wisdom",
      text: "Regularity is king. Go to bed at the same time and wake up at the same time, no matter whether it's the weekday or the weekend, and even if you've had a bad night of sleep.",
      author: "Matthew Walker",
      source: "Why We Sleep",
      url: "https://www.sleepdiplomat.com",
      application: "Fix the wake time first. The bedtime follows it on its own.",
    },
    {
      id: "sleep-temperature-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Your body has to drop its core temperature by about 2–3°F to fall asleep and stay asleep. A cool room isn't a preference, it's a precondition.",
      author: "Why We Sleep (paraphrased)",
      application: "Set the thermostat to 65–68°F tonight.",
    },
    {
      id: "sleep-bath-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "The warm bath effect: a hot bath sends blood to the surface of your skin, and when you get out your core temperature plummets. You fall asleep faster because you got warmer first.",
      author: "Why We Sleep (paraphrased)",
    },
    {
      id: "sleep-light-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Get light in your eyes early and keep it out of them late. That single contrast does more for your sleep than most things you could buy.",
      author: "Circadian protocols (paraphrased)",
      application: "Five to ten minutes outside within an hour of waking. No sunglasses.",
    },
    {
      id: "sleep-caffeine-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Caffeine's half-life is roughly six hours. The afternoon coffee is still working at midnight — you just can't feel it, which is precisely the problem.",
      author: "Why We Sleep (paraphrased)",
    },
    {
      id: "sleep-alcohol-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Alcohol is a sedative, not a sleep aid. It knocks you out and then fragments the night and suppresses REM. Sedation is not sleep.",
      author: "Why We Sleep (paraphrased)",
    },
    {
      id: "sleep-dim-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Dim the lights by half in the hour before bed. Melatonin is released by darkness, and your living room at full brightness is telling your brain it is still afternoon.",
      author: "Why We Sleep (paraphrased)",
    },
    {
      id: "sleep-debt-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "You cannot bank sleep in advance, and you only partially repay what you owe. The best you can do is stop borrowing.",
      author: "Why We Sleep (paraphrased)",
    },
    {
      id: "sleep-opportunity-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Sleep opportunity is not sleep. If you need eight hours, you have to be in bed for closer to eight and a half.",
      author: "Sleep research consensus",
    },
    {
      id: "sleep-nsdr-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "A bad night is not a lost day. Ten to twenty minutes of non-sleep deep rest recovers more than another coffee will.",
      author: "Circadian protocols (paraphrased)",
      pillars: ["sleep", "mind"],
    },
    {
      id: "sleep-foundation-1",
      kind: "mantra",
      collection: "sleep-wisdom",
      text: "Sleep is not the thing you do when the important work is finished. It is the thing that decides how good the important work is.",
      author: "Why We Sleep (paraphrased)",
    },
  ],
}
