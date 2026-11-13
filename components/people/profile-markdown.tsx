import Markdown from "react-markdown";
import type { Root, RootContent } from "hast";

// Resolved Markdown citations are links by this point. Only remove orphan
// numbers from prose, preserving code samples and labels of working links.
function stripOrphanCitations() {
  function clean(node: Root | RootContent) {
    if (node.type === "text") node.value = node.value.replace(/\[\d+\]/g, "");
    if (node.type === "element" && ["a", "code", "pre"].includes(node.tagName)) return;
    if ("children" in node) node.children.forEach(clean);
  }
  return clean;
}

export function ProfileMarkdown({ children, preview = false }: { children: string; preview?: boolean }) {
  return (
    <div className={preview ? "line-clamp-3 text-slate-400 mb-4" : "space-y-3 text-slate-300 leading-relaxed [&_a]:text-purple-300 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_h2]:font-bold [&_h3]:font-semibold"}>
      <Markdown skipHtml rehypePlugins={[stripOrphanCitations]} disallowedElements={preview ? ["a", "img"] : ["img"]} unwrapDisallowed>{children}</Markdown>
    </div>
  );
}
