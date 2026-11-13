import { createHash } from "node:crypto";
import biographies from "@/data/profile-biographies.json";

// Cards can use editorial summaries. The About page keeps the full biography.
export function profileSummary(person: { slug: string; bio: string }) {
  const entry = biographies[person.slug as keyof typeof biographies];
  if (entry && createHash("sha256").update(person.bio).digest("hex") === entry.digest) return entry.bio;
  return person.bio;
}


export function profileBiography(person: { slug: string; bio: string }) {
  if (person.slug === "wim-hof" || person.slug === "bryan-johnson") return profileSummary(person)
  return person.bio
}
