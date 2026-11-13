type JsonLdProps = {
  data: Record<string, any>;
};

/**
 * Renders structured data as a plain <script> tag so it lands in the
 * server-rendered HTML. next/script defers injection to the client, which
 * hides JSON-LD from crawlers that don't execute JavaScript, and dedupes by
 * `id` — so sibling schemas sharing an id silently drop.
 */
export function JsonLd({ data }: JsonLdProps) {
  // Escape `<` so DB-sourced strings can't break out of the script element.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
