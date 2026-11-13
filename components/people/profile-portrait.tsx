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
  if (!src || wrongKennedy || failed === src) return null;
  return (
    <figure className="mb-4">
      <img src={src} alt={person.name} loading={compact ? "lazy" : "eager"} width={96} height={96}
        onError={() => setFailed(src)}
        className={compact ? "size-16 rounded-full object-cover" : "size-24 rounded-full object-cover"} />
    </figure>
  );
}
