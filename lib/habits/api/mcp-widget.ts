/**
 * ChatGPT Apps SDK component for catalog results.
 *
 * Whether ChatGPT draws a markdown image or a resource link inline isn't
 * something a server controls. An Apps SDK component is: the tool descriptor
 * names an HTML template (`_meta["openai/outputTemplate"]`), served here as an
 * MCP resource with the `text/html+skybridge` MIME type, and ChatGPT renders it
 * in a sandboxed iframe with the tool's structuredContent as
 * `window.openai.toolOutput`. The cards show Liberture's official image, name,
 * pillar, difficulty, duration, summary and a link.
 *
 * Other clients ignore the `openai/*` keys and keep using the text and
 * `imageUrl` fields. The template deliberately does not claim the generic MCP
 * Apps `ui.resourceUri`, whose clients expect a different (postMessage)
 * protocol this page doesn't speak.
 */

export const CATALOG_WIDGET_URI = "ui://widget/liberture-catalog-v1.html"
export const WIDGET_MIME_TYPE = "text/html+skybridge"

/** Tool descriptor `_meta` for tools whose results render as catalog cards. */
export function catalogWidgetToolMeta(): Record<string, unknown> {
  return {
    "openai/outputTemplate": CATALOG_WIDGET_URI,
    "openai/toolInvocation/invoking": "Looking through the Liberture catalog…",
    "openai/toolInvocation/invoked": "Here's what the catalog has",
    "openai/widgetAccessible": false,
  }
}

/** Resource `_meta`: which origins the sandboxed page may load (the images) and what the model should know. */
export function catalogWidgetResourceMeta(origin: string): Record<string, unknown> {
  return {
    "openai/widgetDescription":
      "Shows the Liberture catalog results as cards with each item's official image, name, pillar, difficulty, duration and a link. The cards are already visible to the user: don't repeat every item, just add a short recommendation.",
    "openai/widgetPrefersBorder": true,
    "openai/widgetCSP": { connect_domains: [], resource_domains: [origin] },
  }
}

export function catalogWidgetResource(origin: string) {
  return {
    uri: CATALOG_WIDGET_URI,
    name: "liberture-catalog-cards",
    title: "Liberture catalog cards",
    description: "ChatGPT component: catalog results as cards with official images.",
    mimeType: WIDGET_MIME_TYPE,
    _meta: catalogWidgetResourceMeta(origin),
  }
}

/** The template. Self-contained: no external scripts or styles, so the widget CSP only needs the image origin. */
export function catalogWidgetHtml(): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { --bg:#0f0d1f; --card:#17142c; --line:rgba(255,255,255,.1); --text:#f5f3ff; --muted:#a8a3c7; --chip:rgba(255,255,255,.07); }
  .light { --bg:#ffffff; --card:#f7f6fb; --line:rgba(15,13,31,.12); --text:#15122b; --muted:#5c577a; --chip:rgba(15,13,31,.06); }
  * { box-sizing: border-box; }
  body { margin:0; font: 14px/1.4 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background: transparent; color: var(--text); }
  .row { display:flex; gap:12px; overflow-x:auto; padding:4px 2px 10px; scroll-snap-type:x mandatory; }
  .card { flex:0 0 280px; scroll-snap-align:start; background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; }
  .card img { display:block; width:100%; aspect-ratio:1200/630; object-fit:cover; background:var(--chip); }
  .ph { width:100%; aspect-ratio:1200/630; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:28px; color:#fff; }
  .body { padding:12px 14px 14px; display:flex; flex-direction:column; gap:6px; flex:1; }
  .name { font-weight:700; font-size:15px; margin:0; }
  .meta { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { font-size:11px; padding:2px 8px; border-radius:999px; background:var(--chip); color:var(--muted); }
  .cap { text-transform:capitalize; }
  .chip.done { color:#3fcf8e; }
  .sum { color:var(--muted); margin:0; flex:1; }
  .why { color:var(--muted); margin:0; font-style:italic; }
  a.view { align-self:flex-start; margin-top:4px; font-weight:600; color:#8b93f8; text-decoration:none; }
  a.view:hover { text-decoration:underline; }
  .empty { color:var(--muted); padding:8px 2px; }
</style></head>
<body><div id="root" class="row"></div>
<script>
(function () {
  var PILLAR = { work:"#8b93f8", sleep:"#4fc7d9", nutrition:"#3fcf8e", mind:"#f472b6", exercise:"#f2a15a", finance:"#d4b23c" };
  function items(out) {
    if (!out || typeof out !== "object") return [];
    var list = [];
    ["protocols", "habits", "recommendations"].forEach(function (key) {
      if (Array.isArray(out[key])) list = list.concat(out[key]);
    });
    if (!list.length && out.imageUrl && out.name) list = [out];
    return list.filter(function (i) { return i && typeof i === "object" && i.name; });
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function open(href) {
    try { if (window.openai && window.openai.openExternal) { window.openai.openExternal({ href: href }); return; } } catch (e) {}
    window.open(href, "_blank", "noopener");
  }
  function placeholder(item) {
    var ph = el("div", "ph", (item.name || "?").charAt(0).toUpperCase());
    ph.style.background = PILLAR[item.pillar] || "#6b6690";
    return ph;
  }
  function card(item) {
    var c = el("article", "card");
    if (item.imageUrl) {
      var img = el("img");
      img.src = item.imageUrl; img.alt = item.name; img.loading = "lazy";
      img.onerror = function () { c.replaceChild(placeholder(item), img); };
      c.appendChild(img);
    } else c.appendChild(placeholder(item));
    var b = el("div", "body");
    b.appendChild(el("p", "name", item.name));
    var meta = el("div", "meta");
    [item.pillar, item.kind === "habit" ? "habit" : null, item.difficulty].forEach(function (v) { if (v) meta.appendChild(el("span", "chip cap", String(v))); });
    var when = item.duration || item.schedule;
    if (when) meta.appendChild(el("span", "chip", String(when)));
    if (item.adopted || item.alreadyTracked) meta.appendChild(el("span", "chip done", "✓ tracking"));
    b.appendChild(meta);
    var text = item.summary || item.tagline || item.description;
    if (text) b.appendChild(el("p", "sum", text));
    if (item.reason) b.appendChild(el("p", "why", item.reason));
    if (item.infoUrl) {
      var a = el("a", "view", item.kind === "habit" ? "View habit →" : "View protocol →");
      a.href = item.infoUrl; a.target = "_blank"; a.rel = "noopener";
      a.addEventListener("click", function (e) { e.preventDefault(); open(item.infoUrl); });
      b.appendChild(a);
    }
    c.appendChild(b);
    return c;
  }
  function render() {
    var oa = window.openai || {};
    document.documentElement.className = oa.theme === "light" ? "light" : "";
    var root = document.getElementById("root");
    var list = items(oa.toolOutput);
    root.textContent = "";
    if (!list.length) { root.appendChild(el("div", "empty", oa.toolOutput ? "Nothing in the catalog matched." : "")); return; }
    list.slice(0, 20).forEach(function (i) { root.appendChild(card(i)); });
  }
  window.addEventListener("openai:set_globals", render);
  render();
})();
</script></body></html>
`
}
