"use client";

import { useState } from "react";
import portraits from "@/data/profile-portraits.json";

export function ProfilePortrait({ person, compact = false }: {
  person: { slug: string; name: string; imageUrl: string | null };
  compact?: boolean;
}) {
  const credit = portraits[person.slug as keyof typeof portraits];
  const [failed, setFailed] = useState<string[]>([]);
  // The imported Kennedy image depicts the humorist, not the marketing author.
  const wrongKennedy = person.slug.startsWith("dan-s-kennedy") && person.imageUrl?.includes("Author_dan_kennedy.jpg");
  const src = [wrongKennedy ? null : person.imageUrl, credit?.src].find(url => url && !failed.includes(url));
  if (!src) return null;
  return (
    <figure className="mb-4">
      <img src={src} alt={person.name} loading={compact ? "lazy" : "eager"} width={96} height={96}
        onError={() => setFailed(previous => [...previous, src])}
        className={compact ? "size-16 rounded-full object-cover" : "size-24 rounded-full object-cover"} />
      {!compact && credit && src === credit.src && (
        <figcaption className="mt-1 text-xs text-slate-400">
          <a href={credit.source} className="underline">{credit.artist ? "Photo by " + credit.artist : "Photo credits"}</a>
          {" · "}{credit.licenseUrl ? <a href={credit.licenseUrl} className="underline">{credit.license}</a> : credit.license}
        </figcaption>
      )}
    </figure>
  );
}
