"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldOption, FieldSelect } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { editorGroups, editorValues, fieldLabel, type DirectoryType, type EditorValues } from "./editor-fields"
import { isEntryField, invalidEntries, OrganizationEntryInput } from "./organization-entry-input"
import { EditHistory } from "./edit-history"

const longText = new Set(["bio", "description", "content", "steps", "benefits", "risks"])
const numberFields = new Set(["year", "rating", "readTime"])
const difficulties = ["beginner", "intermediate", "advanced"] as const

export function DirectoryEditor({ type, id, initialValues, backHref }: {
  type: DirectoryType; id: string; initialValues: EditorValues; backHref: string
}) {
  const t = useTranslations().habits.app.directoryEditor
  const [baseline, setBaseline] = useState(initialValues)
  const [values, setValues] = useState(initialValues)
  const [tab, setTab] = useState("details")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [invalidField, setInvalidField] = useState("")
  const [historyVersion, setHistoryVersion] = useState(0)
  const groups = Object.entries(editorGroups[type]) as [keyof Pick<typeof t, "details" | "content" | "links">, readonly string[]][]
  const changed = Object.entries(values).filter(([field, value]) => value !== baseline[field])
  const required = new Set(["name", "title", "bio", type === "books" ? "author" : "description", ...(type === "articles" ? ["pillar", "readTime"] : [])])

  function update(field: string, value: string) {
    setValues(previous => ({ ...previous, [field]: value }))
    setMessage("")
    setInvalidField("")
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (busy || !changed.length) return
    for (const [group, fields] of groups) {
      const field = fields.find(key => {
        if (values[key] === baseline[key]) return false
        const value = values[key].trim()
        if (type === "organizations" && isEntryField(key)) return invalidEntries(value)
        if (!value) return required.has(key)
        if (key === "readTime") return !Number.isInteger(Number(value)) || Number(value) < 1
        if (key === "year") return !Number.isInteger(Number(value))
        return false
      })
      if (field) {
        setTab(group)
        setMessage(isEntryField(field) ? t.invalidLink : values[field].trim() ? t.invalidNumber : t.required)
        setInvalidField(field)
        requestAnimationFrame(() => document.getElementById("editor-" + field)?.focus())
        return
      }
    }
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch(`/api/${type}/id/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(changed)),
      })
      if (!response.ok) throw new Error("save")
      const saved = editorValues(type, await response.json())
      setBaseline(saved)
      setValues(saved)
      setMessage(t.saved)
      setHistoryVersion(version => version + 1)
    } catch {
      setMessage(t.saveError)
    } finally {
      setBusy(false)
    }
  }

  return <form noValidate onSubmit={save} className="space-y-5">
    <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t.back}</Link>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0"><p className="text-sm text-muted-foreground">{t[type]}</p>
        <h1 className="break-words text-2xl font-semibold">{baseline.name || baseline.title}</h1></div>
      <Button type="submit" disabled={busy || !changed.length}><Save className="size-4" />{busy ? t.saving : t.save}</Button>
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList aria-label={t[type]}>
        {groups.map(([key]) => <TabsTrigger key={key} value={key}>{t[key]}</TabsTrigger>)}
        <TabsTrigger value="history">{t.history}</TabsTrigger>
      </TabsList>
      {groups.map(([group, fields]) => <TabsContent key={group} value={group}>
        <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
          {fields.map(field => {
            const fieldId = "editor-" + field
            const structured = type === "organizations" && isEntryField(field)
            const multiline = longText.has(field) || structured
            const common = { id: fieldId, value: values[field], required: required.has(field), "aria-invalid": invalidField === field || undefined }
            return <div key={field} className={multiline ? "space-y-2 sm:col-span-2" : "min-w-0 space-y-2"}>
              <label htmlFor={fieldId} className="text-sm font-medium">{fieldLabel(t, field)}{required.has(field) && " *"}</label>
              {structured ? <OrganizationEntryInput field={field} id={fieldId} label={fieldLabel(t, field)} value={values[field]} onChange={value => update(field, value)} />
              : field === "difficulty" ? <FieldSelect id={fieldId} value={values[field]} onValueChange={value => update(field, value)} aria-label={t.difficulty}>
                {!difficulties.some(item => item === values[field]) && <FieldOption value={values[field]}>{values[field] || "—"}</FieldOption>}
                {difficulties.map(value => <FieldOption key={value} value={value}>{t[value]}</FieldOption>)}
              </FieldSelect> : multiline ? <Textarea {...common} rows={field === "content" ? 16 : 5} onChange={e => update(field, e.target.value)} />
              : <Input {...common} type={numberFields.has(field) ? "number" : "text"} step={field === "rating" ? "0.1" : undefined}
                min={field === "readTime" ? 1 : undefined} onChange={e => update(field, e.target.value)} />}
            </div>
          })}
        </fieldset>
      </TabsContent>)}
      <TabsContent value="history">{tab === "history" && <EditHistory key={historyVersion} url={`/api/admin/directory/${type}/${encodeURIComponent(id)}/history`} />}</TabsContent>
    </Tabs>
  </form>
}
