import { jsPDF } from "jspdf"
import type { CatalogProtocol } from "./catalog"
import { formatSourceMeta } from "./sources"
import type { useCatalogLabels } from "@/components/habits/marketplace/pillar-tag"
import type { useTranslations } from "@/components/i18n/locale-provider"

type Copy = ReturnType<typeof useTranslations>["habits"]["app"]["protocolReader"]

export function protocolPdf(p: CatalogProtocol, t: Copy, labels: ReturnType<typeof useCatalogLabels>, cover?: Uint8Array) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  const canonical = `https://liberture.com/protocols/${p.slug}`
  doc.setProperties({ title: p.name, author: "Liberture", subject: p.tagline })
  let y = 0
  function header() {
    doc.setFillColor("#17112e").rect(0, 0, 210, 17, "F")
    doc.setFont("helvetica","bold").setFontSize(12).setTextColor("#ffffff").text("Liberture", 18, 11)
    doc.setFont("helvetica","normal").setFontSize(9).text(labels.pillar[p.pillar], 192, 11, {align:"right"})
    y = 28
  }
  function room(height: number) { if (y + height > 275) { doc.addPage(); header() } }
  function write(text: string, size = 11, bold = false, link?: string) {
    const style = () => doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(link ? "#304f99" : bold ? "#251941" : "#313746")
    style()
    const lines: string[] = doc.splitTextToSize(text, 174)
    for (const line of lines) {
      room(size * 0.49); style()
      if (link) doc.textWithLink(line, 18, y, {url:link})
      else doc.text(line, 18, y)
      y += size * 0.49
    }
    y += 2
  }
  function section(name: string, lines: string[]) {
    if (!lines.length) return
    room(22); y += 3; write(name, 14, true)
    for (const line of lines) write(line)
  }
  header()
  if (cover) { doc.addImage(cover, "PNG", 18, y, 174, 91.35); y += 102 }
  write(p.name, 22, true)
  write([labels.difficulty[p.difficulty], p.duration, labels.costSummary(p.cost,p.costTier)].filter(Boolean).join("  ·  "),10)
  write(p.description)
  section(t.whyItWorks,[p.why])
  section(t.howToRun,p.steps.map((step,i) => `${i+1}. ${step}`))
  section(t.habits,p.habits.map(h => `${h.name}  ·  ${h.time}  ·  ${labels.schedule(h.schedule)}\n${h.why}`))
  section(t.whatYouGet,p.benefits)
  section(t.watchOutFor,p.risks)
  section(t.whatYouNeed,p.equipment)
  section(t.whatItCosts,[labels.costSummary(p.cost,p.costTier), ...(p.cost?.items ?? []).map(i => [i.label,i.amount == null ? "" : `${i.amount} ${p.cost?.currency ?? "USD"}`,i.recurrence,i.optional ? t.optional : ""].filter(Boolean).join(" · ")),p.cost?.note ?? ""].filter(Boolean))
  section(t.evidence, [p.author?.name ?? p.creator,...p.coAuthors.map(a=>a.name)].filter(Boolean))
  for (const s of p.evidence) write([s.title,formatSourceMeta(s)].filter(Boolean).join(" · "),10,false,s.url && /^https?:\/\//i.test(s.url) ? s.url : undefined)
  const pages = doc.getNumberOfPages()
  for (let i=1;i<=pages;i++) {
    doc.setPage(i);doc.setDrawColor("#ded9ec").line(18,282,192,282)
    doc.setFont("helvetica","normal").setFontSize(9).setTextColor("#605675")
    doc.textWithLink("liberture.com",18,289,{url:canonical})
    doc.text(`${i} / ${pages}`,192,289,{align:"right"})
  }
  return doc
}
