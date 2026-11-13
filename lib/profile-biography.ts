import { createHash } from "node:crypto";
import biographies from "@/data/profile-biographies.json";

// Replace the archived enrichment text, leaving subsequent editorial changes intact.
export function profileBiography(person: { slug: string; bio: string }) {
  const entry = biographies[person.slug as keyof typeof biographies];
  if (entry && createHash("sha256").update(person.bio).digest("hex") === entry.digest) return entry.bio;
  return person.bio;
}
