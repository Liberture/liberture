import { createHash } from "node:crypto";
import biographies from "@/data/profile-biographies.json";

import authorBios from "@/data/directory-author-bios.json";

function authorBio(person: { slug: string; bio: string }) {
  const entry = authorBios[person.slug as keyof typeof authorBios];
  return entry && createHash("sha256").update(person.bio).digest("hex") === entry.digest ? entry : undefined;
}

// Cards can use editorial summaries. The About page keeps the full biography.
export function profileSummary(person: { slug: string; bio: string }) {
  const author = authorBio(person);
  if (author) return author.bio;
  const entry = biographies[person.slug as keyof typeof biographies];
  if (entry) {
    const digest = createHash("sha256").update(person.bio).digest("hex");
    if (digest === entry.digest || ("cleanDigest" in entry && digest === entry.cleanDigest)) return entry.bio;
  }
  return person.bio;
}


export function profileBiography(person: { slug: string; bio: string }) {
  if (person.slug === "ram-dass" || person.slug === "wim-hof" || person.slug === "bryan-johnson") return profileSummary(person)
  const author = authorBio(person);
  return author ? author.bio + "\n\n[Further reading](" + author.source + ")" : person.bio;
}
