import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/components/i18n/locale-provider"
import { entries, httpUrl, type Entry } from "@/lib/directory/organization-entries"

export function isEntryField(field: string) {
  return field === "keyPeople" || field === "resources" || field === "publications"
}

function editableEntries(value: string): Entry[] {
  // Empty titles and URLs are valid draft states while adding a row.
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.flatMap(row => {
      if (typeof row === "string") return [{ title: row }]
      if (row && typeof row.title === "string") return [{ title: row.title, url: String(row.url ?? "") }]
      return []
    })
  } catch {
    // Older records also use plain text lists.
  }
  return entries(value)
}

export function invalidEntries(value: string) {
  return editableEntries(value).some(row => !row.title.trim() || (!!row.url && !httpUrl(row.url)))
}

export function OrganizationEntryInput({ field, id, value, label, onChange }: {
  field: string; id: string; value: string; label: string; onChange: (value: string) => void
}) {
  const t = useTranslations().habits.app.directoryEditor
  const list = editableEntries(value)
  const people = field === "keyPeople"
  function change(next: Entry[]) {
    onChange(JSON.stringify(next.map(item => people || !item.url ? item.title : item)))
  }
  return <div role="group" aria-label={label} className="space-y-2">
    {list.map((row, index) => <div key={index} className="flex flex-wrap items-center gap-2">
      <Input id={index === 0 ? id : undefined} aria-label={`${people ? t.name : t.linkTitle} ${index + 1}`} value={row.title} placeholder={people ? t.name : t.linkTitle}
        className="min-w-32 flex-1" onChange={event => change(list.map((item, n) => n === index ? { ...item, title: event.target.value } : item))} />
      {!people && <Input aria-label={`${t.linkUrl} ${index + 1}`} value={row.url ?? ""} placeholder="https://"
        className="min-w-32 flex-1" onChange={event => change(list.map((item, n) => n === index ? { ...item, url: event.target.value } : item))} />}
      <Button type="button" variant="ghost" size="icon" aria-label={`${t.removeEntry} ${index + 1}`} onClick={() => change(list.filter((_, n) => n !== index))}><Minus /></Button>
    </div>)}
    <Button type="button" id={!list.length ? id : undefined} variant="outline" size="sm" onClick={() => change([...list, { title: "" }])}><Plus />{t.addEntry}</Button>
  </div>
}
