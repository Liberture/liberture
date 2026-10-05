/**
 * The people behind the protocols.
 *
 * The library used to carry a bare `creator` string that mixed real people
 * ("Francesco Cirillo") with bodies of work ("WHO guidelines"). Splitting that
 * into a registry lets the marketplace browse by author and lets the reader show
 * who is actually making the claim — which matters a lot when the claim is about
 * your body.
 *
 * Static app data. Nothing here is ever persisted to the storage blob.
 */

export interface Author {
  id: string
  name: string
  /** What earns them a hearing. Kept factual — no marketing. */
  credentials: string
  /** One line on the lens they bring. */
  bio: string
  url?: string
  /**
   * `person` authors are browsable in the marketplace filter. `consensus`
   * covers guideline bodies and research literatures that have no single face.
   */
  kind: "person" | "consensus"
}

export const AUTHORS = {
  "andrew-huberman": {
    id: "andrew-huberman",
    name: "Andrew Huberman",
    credentials: "PhD; Professor of Neurobiology & Ophthalmology, Stanford",
    bio: "Translates circadian, stress and neuroplasticity research into protocols you can run tomorrow.",
    url: "https://hubermanlab.com",
    kind: "person",
  },
  "matthew-walker": {
    id: "matthew-walker",
    name: "Matthew Walker",
    credentials: "PhD; Professor of Neuroscience, UC Berkeley",
    bio: "Sleep scientist whose central message is that regularity beats every other lever.",
    url: "https://www.sleepdiplomat.com",
    kind: "person",
  },
  "peter-attia": {
    id: "peter-attia",
    name: "Peter Attia",
    credentials: "MD; longevity-focused physician",
    bio: "Trains for the last decade of life rather than the next race — strength, stability, VO2 max.",
    url: "https://peterattiamd.com",
    kind: "person",
  },
  "rhonda-patrick": {
    id: "rhonda-patrick",
    name: "Rhonda Patrick",
    credentials: "PhD in biomedical science",
    bio: "Reads the nutrition and hormesis literature closely and reports what the effect sizes actually are.",
    url: "https://www.foundmyfitness.com",
    kind: "person",
  },
  "pavel-tsatsouline": {
    id: "pavel-tsatsouline",
    name: "Pavel Tsatsouline",
    credentials: "Strength coach; founder of StrongFirst",
    bio: "Treats strength as a practisable skill: frequent, crisp, and never to failure.",
    url: "https://www.strongfirst.com",
    kind: "person",
  },
  "wim-hof": {
    id: "wim-hof",
    name: "Wim Hof",
    credentials: "Cold-exposure practitioner; subject of published trials",
    bio: "Breathwork plus cold, with the unusual distinction of having been tested in a controlled study.",
    url: "https://www.wimhofmethod.com",
    kind: "person",
  },
  "dave-asprey": {
    id: "dave-asprey",
    name: "Dave Asprey",
    credentials: "Entrepreneur; popularised the term 'biohacking'",
    bio: "Spent roughly $2M self-experimenting and reports his biggest sleep win came from $8 bulbs.",
    url: "https://daveasprey.com",
    kind: "person",
  },
  "bryan-johnson": {
    id: "bryan-johnson",
    name: "Bryan Johnson",
    credentials: "Founder of Blueprint; n-of-1 longevity protocol",
    bio: "Runs the most heavily measured personal protocol in existence, at a cost most people cannot match.",
    url: "https://protocol.bryanjohnson.com",
    kind: "person",
  },
  "satchin-panda": {
    id: "satchin-panda",
    name: "Satchin Panda",
    credentials: "PhD; Professor, Salk Institute",
    bio: "Circadian biologist whose work established time-restricted eating as a distinct intervention.",
    url: "https://www.salk.edu/scientist/satchidananda-panda/",
    kind: "person",
  },
  "ryan-holiday": {
    id: "ryan-holiday",
    name: "Ryan Holiday",
    credentials: "Author; modern popularizer of Stoicism",
    bio: "Turns Marcus Aurelius and Seneca into a morning-and-evening practice rather than a reading list.",
    url: "https://dailystoic.com",
    kind: "person",
  },
  "james-clear": {
    id: "james-clear",
    name: "James Clear",
    credentials: "Author of Atomic Habits",
    bio: "Reframes habits around identity: the goal is to become the kind of person who does this.",
    url: "https://jamesclear.com",
    kind: "person",
  },
  "bj-fogg": {
    id: "bj-fogg",
    name: "BJ Fogg",
    credentials: "PhD; founder of the Behavior Design Lab, Stanford",
    bio: "Makes behaviours so small that motivation stops being the bottleneck.",
    url: "https://tinyhabits.com",
    kind: "person",
  },
  "cal-newport": {
    id: "cal-newport",
    name: "Cal Newport",
    credentials: "PhD; Professor of Computer Science, Georgetown",
    bio: "Argues that undistracted concentration is both increasingly rare and increasingly valuable.",
    url: "https://calnewport.com",
    kind: "person",
  },
  "francesco-cirillo": {
    id: "francesco-cirillo",
    name: "Francesco Cirillo",
    credentials: "Creator of the Pomodoro Technique",
    bio: "Put a timer on focus and made starting the easy part.",
    url: "https://francescocirillo.com",
    kind: "person",
  },
  "sleep-research-consensus": {
    id: "sleep-research-consensus",
    name: "Sleep research consensus",
    credentials: "Converging findings across sleep laboratories",
    bio: "Where no single researcher owns the result and the literature broadly agrees.",
    kind: "consensus",
  },
  "exercise-guidelines": {
    id: "exercise-guidelines",
    name: "Physical activity guidelines",
    credentials: "WHO and national public-health bodies",
    bio: "The conservative floor that population-level evidence supports.",
    url: "https://www.who.int/publications/i/item/9789240015128",
    kind: "consensus",
  },
  "personal-finance-consensus": {
    id: "personal-finance-consensus",
    name: "Personal finance consensus",
    credentials: "Long-standing behavioural-finance practice",
    bio: "Boring, repeatedly validated advice that survives every market cycle.",
    kind: "consensus",
  },
} as const satisfies Record<string, Author>

export type AuthorId = keyof typeof AUTHORS

/** Stable display order — declaration order, which groups people before consensus. */
export const AUTHOR_IDS = Object.keys(AUTHORS) as AuthorId[]

export function findAuthor(id: string | undefined): Author | undefined {
  if (!id) return undefined
  return (AUTHORS as Record<string, Author>)[id]
}

/** Display string for a protocol's author, falling back to the legacy free-form creator. */
export function authorLabel(author: Author | undefined, creator: string): string {
  return author?.name ?? creator
}
