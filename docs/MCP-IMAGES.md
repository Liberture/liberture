# Catalog images over MCP

Assistants (ChatGPT, Claude) get the **official Liberture image** for catalog protocols and habits, so a recommendation can be shown with the catalog's own picture instead of something found by an image search.

## What the tools return

`imageUrl` is an absolute, public HTTPS URL to the protocol's PNG (1200×630, no auth), or `null` when there is no official image.

| Tool | Where |
|---|---|
| `search_catalog` | every item in `protocols[]` and `habits[]` |
| `get_recommendations` | every card in `recommendations[]` |
| `get_habit` | top level, for a habit adopted from the catalog |
| `get_coach_state` | every suggestion in `suggestions.pending[]` / `snoozed[]` |
| `adopt_habit` | top level (it uses the same link helper) |

Rules:
- A **protocol** uses its own image: `/protocols/images/<slug>.png`.
- A **catalog habit** that belongs to a protocol uses that protocol's image.
- A **standalone catalog habit** (10 of them, e.g. `mobility-stretch`, which belong to no protocol) has its own: `/protocols/images/habits/<slug>.png`.
- A **custom** habit or an unknown slug gets `null`.

The images are the ones drawn by `scripts/generate-protocol-images.tsx` and served from `public/protocols/images/` (and `habits/` for standalone habits) (see the protocol pages and the image sitemap). Everything is built in one place: `catalogImageUrl()` / `catalogLinks()` in `lib/habits/api/assistant.ts`, next to `infoUrl`.

The field is purely additive, so existing consumers are unaffected.

Example (`search_catalog`, one protocol):

```json
{
  "kind": "protocol",
  "slug": "daily-mindfulness-meditation",
  "name": "Daily Mindfulness Meditation",
  "summary": "Ten minutes of noticing your attention wandered and bringing it back.",
  "pillar": "mind",
  "difficulty": "easy",
  "duration": "Ongoing, 10 min/day",
  "adopted": false,
  "habits": [{ "slug": "meditation", "name": "Meditation", "time": "07:30", "schedule": "Every day", "adopted": false }],
  "infoUrl": "https://liberture.com/protocols/daily-mindfulness-meditation",
  "imageUrl": "https://liberture.com/protocols/images/daily-mindfulness-meditation.png"
}
```

## MCP `resource_link` blocks

For clients on **MCP 2025-06-18 or later** (from the `MCP-Protocol-Version` header), every tool result that contains images also gets `resource_link` content blocks after the usual text blocks. There is one per distinct image, at most 10:

```json
{ "type": "resource_link", "uri": "https://liberture.com/protocols/images/daily-mindfulness-meditation.png",
  "name": "Daily Mindfulness Meditation — image", "title": "Daily Mindfulness Meditation",
  "description": "Official Liberture catalog image for Daily Mindfulness Meditation", "mimeType": "image/png" }
```

Older clients get exactly the results they got before. Images are linked, not embedded as base64 `image` blocks: base64 would make every catalog search hundreds of KB.

## Telling the model

- **Tool descriptions:** `search_catalog`, `get_recommendations`, `get_habit` and `get_coach_state` say what `imageUrl` is, to show it when the interface can display images (for example `![name](imageUrl)`), and never to substitute an image from elsewhere.
- **Server instructions** and the downloadable Claude skill say the same.

## Rendering limits

Whether the picture actually **appears** in the chat is up to the client, not the server:

- **ChatGPT:**
  - The model receives `imageUrl` and the resource links.
  - Whether a markdown image in its reply, or a resource link, is drawn inline depends on the ChatGPT surface and version, so it is not guaranteed.
  - The dependable way to get rich cards in ChatGPT is an Apps SDK component: an HTML template exposed as an MCP resource and referenced from the tool's `_meta`. That isn't built yet; it's the next step if inline cards are a must.
  - The link (`infoUrl`) is always usable.
- **Claude:**
  - Claude reads the fields and links.
  - Its apps don't generally render arbitrary external images inside replies, so expect the name, details and a link rather than the picture.
- **Any client:** the image URLs are public, so pasting one in a browser, or a client that previews links, shows the official image.

Check it in the real clients after refreshing the connector: "Recommend me a Liberture protocol for sleep, with its image".

## Tests

`lib/habits/api/__tests__/catalog-images.test.ts` covers:
- protocol images, and habits inside multi-habit protocols;
- standalone habits getting their own image, including the "10-minute mobility" case;
- custom and unknown entries returning `null`;
- `infoUrl` unchanged;
- a file existing for every protocol and standalone habit;
- `imageUrl` in all four tools;
- resource links only for 2025-06-18+ clients, deduplicated and capped.
