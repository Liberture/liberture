"use client"

import { useEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldOption, FieldSelect } from "@/components/ui/select"
import { useTranslations } from "@/components/i18n/locale-provider"
import { httpUrl } from "@/lib/directory/organization-entries"

type OrganizationOption = { id: string; name: string }
export type DirectoryRelationship = { id: string; role: string; sourceUrl: string }

export function invalidRelationships(rows: DirectoryRelationship[]) {
  return rows.some(row => !row.id || !row.role.trim() || !httpUrl(row.sourceUrl)) ||
    new Set(rows.map(row => JSON.stringify([row.id, row.role.trim().toLowerCase()]))).size !== rows.length
}

export type RelationshipField = "relatedOrganizations" | "relatedPeople"
export function relationshipField(key: string): key is RelationshipField {
  return key === "relatedOrganizations" || key === "relatedPeople"
}
export function relationshipPayload(field: RelationshipField, rows: DirectoryRelationship[]) {
  const key = field === "relatedOrganizations" ? "organizationId" : "personId"
  return rows.map(({ id, role, sourceUrl }) => ({ [key]: id, role, sourceUrl }))
}

export function DirectoryRelationshipsInput({ field, rows, onChange }: { field: RelationshipField; rows: DirectoryRelationship[]; onChange: (rows: DirectoryRelationship[]) => void }) {
  const t = useTranslations().habits.app.directoryEditor
  const organizations = field === "relatedOrganizations"
  const entity = organizations ? "organizations" : "people"
  const [options, setOptions] = useState<OrganizationOption[]>([])
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setFailed(false)
    async function load() {
      const response = await fetch(`/api/${entity}?all=true`, { signal: controller.signal })
      if (!response.ok) throw new Error("organizations")
      const result = await response.json()
      if (!controller.signal.aborted) setOptions(result[entity])
    }
    void load().catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [attempt, entity])
  function update(index: number, field: keyof DirectoryRelationship, value: string) {
    onChange(rows.map((row, n) => n === index ? { ...row, [field]: value } : row))
  }
  return <div className="space-y-3">
    {rows.map((row, index) => <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2" key={index}>
      <FieldSelect value={row.id} onValueChange={value => update(index, "id", value)} aria-label={t[field]}>
        <FieldOption value="">{organizations ? t.selectOrganization : t.selectPerson}</FieldOption>
        {options.map(option => <FieldOption key={option.id} value={option.id}>{option.name}</FieldOption>)}
      </FieldSelect>
      <Input value={row.role} aria-label={t.relationshipRole} placeholder={t.relationshipRole} onChange={e => update(index, "role", e.target.value)} />
      <div className="flex gap-2 sm:col-span-2">
        <Input type="url" value={row.sourceUrl} aria-label={t.sourceUrl} placeholder={t.sourceUrl} onChange={e => update(index, "sourceUrl", e.target.value)} />
        <Button type="button" variant="ghost" size="icon" aria-label={t.removeEntry} onClick={() => onChange(rows.filter((_, n) => n !== index))}><Minus /></Button>
      </div>
    </div>)}
    {failed && <p role="alert">{t.loadLinkError} <Button type="button" variant="outline" onClick={() => setAttempt(a => a + 1)}>{t.retry}</Button></p>}
    <Button type="button" variant="outline" size="sm" disabled={!options.length} onClick={() => onChange([...rows, { id: "", role: "", sourceUrl: "" }])}><Plus />{organizations ? t.linkOrganization : t.linkPerson}</Button>
  </div>
}
