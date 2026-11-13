"use client";

import { useState } from "react";

export function ProfilePortrait({ person, compact = false }: {
  person: { slug: string; name: string; imageUrl: string | null };
  compact?: boolean;
}) {
  const [failed, setFailed] = useState<string>();
  // The imported Kennedy image depicts the humorist, not the marketing author.
  const wrongKennedy = person.slug.startsWith("dan-s-kennedy") && person.imageUrl?.includes("Author_dan_kennedy.jpg");
  const src = person.imageUrl;
  if (!src || wrongKennedy || failed === src) return compact ? <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-900 to-indigo-950 text-xl font-semibold text-violet-200">{person.name.split(/\s+/).filter(Boolean).filter((_, i, words) => i === 0 || i === words.length - 1).map(word => word[0]).join("")}</span> : null;
  return (
    <figure className={compact ? "shrink-0" : "mb-4"}>
      <img src={src} alt={person.name} loading={compact ? "lazy" : "eager"} width={96} height={96}
        onError={() => setFailed(src)}
        className={compact ? "size-16 rounded-full object-cover" : "size-24 rounded-full object-cover"} />
    </figure>
  );
}
