"use client";
import { useTranslations as useUiCopy } from "next-intl"

import { HelpTooltip } from "@/components/ui/tooltip"
import { FieldSelect, FieldOption } from "@/components/ui/select"
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

import { editorGroups, type DirectoryType } from "./directory/editor-fields";
import { DirectoryRelationshipsInput, invalidRelationships, relationshipPayload, type DirectoryRelationship } from "./directory/directory-relationships-input";

interface DirectoryItem {
  id: string;
  name?: string;
  title?: string;
  author?: string;
  bio?: string;
  description?: string;
}

const DIRECTORY_TYPES: DirectoryType[] = Object.keys(editorGroups) as DirectoryType[];

export default function DirectoryAdmin() {
  const uiCopy = useUiCopy("publicCopy.directoryAdmin")
  const t = useTranslations().habits.app.directoryTable;
  const params = useSearchParams();
  const activeType = DIRECTORY_TYPES.find(type => type === params.get("type")) ?? "people";
  const searchTerm = params.get("q") ?? "";
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  function changeFilter(key: "type" | "q", value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    setItems([]);
    async function load() {
      try {
        const response = await fetch(`/api/${activeType}?all=true`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!controller.signal.aborted) setItems(data[activeType]);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [activeType, revision]);

  async function deleteItem(item: DirectoryItem) {
    if (!confirm(uiCopy("confirmDelete", { name: item.name || item.title || "" }))) return;

    try {
      const response = await fetch(`/api/${activeType}/id/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setRevision(value => value + 1);
    } catch (error) {
      console.error("Delete error:", error);
      alert(uiCopy("deleteError"));
    }
  }

  function getDisplayName(item: DirectoryItem): string {
    return item.name || item.title || "Unknown";
  }

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const name = getDisplayName(item).toLowerCase();
    const desc = (item.bio || item.description || "").toLowerCase();
    const author = (item.author || "").toLowerCase();
    return name.includes(searchLower) || desc.includes(searchLower) || author.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <FieldSelect className="w-auto" displayValue={t[activeType]} value={activeType} aria-label={t.entry} onValueChange={value => changeFilter("type", value)}>
          {DIRECTORY_TYPES.map(type => <FieldOption key={type} value={type}>{t[type]}</FieldOption>)}
        </FieldSelect>
        <div className="relative min-w-40 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label={t.search} placeholder={t.search} value={searchTerm}
            onChange={event => changeFilter("q", event.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowAddModal(true)}><Plus />{t.add}</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">{t[activeType]}</caption>
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr><th scope="col" className="px-4 py-3 text-left font-medium">{t.entry}{!loading && !failed && ` (${filteredItems.length})`}</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">{t.actions}</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(loading || failed || !filteredItems.length) && <tr><td colSpan={2} role="status" className="p-6 text-center text-muted-foreground">
              {loading ? t.loading : failed ? t.error : t.empty}
            </td></tr>}
            {!loading && filteredItems.map(item => {
              const name = getDisplayName(item);
              const href = `/admin/directory/${activeType}/${encodeURIComponent(item.id)}${searchTerm ? "?" + new URLSearchParams({ q: searchTerm }) : ""}`;
              return <tr key={item.id} className="hover:bg-muted/20">
                <th scope="row" className="px-4 py-2 text-left font-medium"><Link href={href} prefetch={false} className="break-words hover:underline">{name}</Link></th>
                <td className="w-px whitespace-nowrap px-3 py-1 text-right">
                  <HelpTooltip label={t.edit}><Button asChild variant="ghost" size="icon-sm">
                    <Link href={href} prefetch={false} aria-label={t.edit + " · " + name}><Edit /></Link>
                  </Button></HelpTooltip>
                  <HelpTooltip label={t.remove}><Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={t.remove + " · " + name} onClick={() => deleteItem(item)}><Trash2 /></Button></HelpTooltip>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Modal */}
      {showAddModal && (
        <AddItemModal
          type={activeType}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              const response = await fetch(`/api/${activeType}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || "Failed to save");
              }

              setShowAddModal(false);
              setRevision(value => value + 1);
            } catch (error: any) {
              alert(uiCopy("error", { message: error.message }));
            }
          }}
        />
      )}
    </div>
  );
}

function AddItemModal({
  type,
  onClose,
  onSave,
}: {
  type: DirectoryType;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const uiCopy = useUiCopy("publicCopy.directoryAdmin")

  const t = useTranslations().habits.app.directoryEditor;
  const [relatedOrganizations, setRelatedOrganizations] = useState<DirectoryRelationship[]>([]);
  const [relatedPeople, setRelatedPeople] = useState<DirectoryRelationship[]>([]);
  const [invalidLinks, setInvalidLinks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const set = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalidRelationships(relatedOrganizations) || invalidRelationships(relatedPeople)) {
      setInvalidLinks(true);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...formData,
        ...(relatedOrganizations.length && { relatedOrganizations: relationshipPayload("relatedOrganizations", relatedOrganizations) }),
        ...(relatedPeople.length && { relatedPeople: relationshipPayload("relatedPeople", relatedPeople) }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <h2 className="text-2xl font-bold mb-4 capitalize">{uiCopy("addNew")} {type.slice(0, -1)}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── People ── */}
          {type === "people" && (
            <>
              <div>
                <label className={labelClass}>{uiCopy("name")}</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("bio")}</label>
                <textarea value={formData.bio || ""} onChange={(e) => set("bio", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("imageUrl")}</label>
                  <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("website")}</label>
                  <input type="url" value={formData.website || ""} onChange={(e) => set("website", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{uiCopy("pillarsCommaSeparated")}</label>
                <input type="text" required value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} placeholder="sleep, nutrition, mind" />
              </div>
            </>
          )}

          {/* ── Articles ── */}
          {type === "articles" && (
            <>
              <div>
                <label className={labelClass}>{uiCopy("title")}</label>
                <input type="text" required value={formData.title || ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("description")}</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("contentMarkdown")}</label>
                <textarea value={formData.content || ""} onChange={(e) => set("content", e.target.value)} rows={6} className={`${inputClass} font-mono`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("author")}</label>
                  <input type="text" value={formData.author || ""} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("readTimeMin")}</label>
                  <input type="number" value={formData.readTime || "5"} onChange={(e) => set("readTime", e.target.value)} className={inputClass} min="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("pillar")}</label>
                  <input type="text" required value={formData.pillar || ""} onChange={(e) => set("pillar", e.target.value)} className={inputClass} placeholder="mind" />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("tagsCommaSeparated")}</label>
                  <input type="text" value={formData.tags || ""} onChange={(e) => set("tags", e.target.value)} className={inputClass} placeholder={uiCopy("sleepMelatonin")} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{uiCopy("urlOptionalAutoGeneratedIfEmpty")}</label>
                <input type="text" value={formData.url || ""} onChange={(e) => set("url", e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* ── Books ── */}
          {type === "books" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("title")}</label>
                  <input type="text" required value={formData.title || ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("authorAlt")}</label>
                  <input type="text" required value={formData.author || ""} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{uiCopy("descriptionAlt")}</label>
                <textarea value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("imageUrl")}</label>
                  <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("year")}</label>
                  <input type="number" value={formData.year || ""} onChange={(e) => set("year", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{uiCopy("pillarsCommaSeparated")}</label>
                <input type="text" required value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} placeholder="sleep, nutrition, mind" />
              </div>
            </>
          )}

          {/* ── Organizations ── */}
          {(type === "organizations" || type === "projects") && (
            <>
              <div>
                <label className={labelClass}>{uiCopy("name")}</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("description")}</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("type")}</label>
                  <input type="text" value={formData.type || ""} onChange={(e) => set("type", e.target.value)} className={inputClass} placeholder={uiCopy("researchNonprofit")} />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("website")}</label>
                  <input type="url" value={formData.website || ""} onChange={(e) => set("website", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{uiCopy("imageUrl")}</label>
                <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("pillarsCommaSeparated")}</label>
                <input type="text" required value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} placeholder="sleep, nutrition, mind" />
              </div>
            </>
          )}

          {(type === "projects" || type === "organizations") && <section className="space-y-2">
            <h3 className={labelClass}>{t.relatedPeople}</h3>
            <DirectoryRelationshipsInput field="relatedPeople" rows={relatedPeople} onChange={rows => { setRelatedPeople(rows); setInvalidLinks(false); }} />
          </section>}
          {type === "projects" && <section className="space-y-2">
            <h3 className={labelClass}>{t.relatedOrganizations}</h3>
            <DirectoryRelationshipsInput field="relatedOrganizations" rows={relatedOrganizations} onChange={rows => { setRelatedOrganizations(rows); setInvalidLinks(false); }} />
          </section>}
          {invalidLinks && <p role="alert">{t.invalidRelationship}</p>}
          {/* ── Protocols ── */}
          {type === "protocols" && (
            <>
              <div>
                <label className={labelClass}>{uiCopy("name")}</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("description")}</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{uiCopy("pillar")}</label>
                  <input type="text" required value={formData.pillar || ""} onChange={(e) => set("pillar", e.target.value)} className={inputClass} placeholder="mind" />
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("difficulty")}</label>
                  <FieldSelect value={formData.difficulty || "beginner"} onValueChange={(value) => set("difficulty", value)} aria-label={uiCopy("difficulty")}>
                    <FieldOption value="beginner">{uiCopy("beginner")}</FieldOption>
                    <FieldOption value="intermediate">{uiCopy("intermediate")}</FieldOption>
                    <FieldOption value="advanced">{uiCopy("advanced")}</FieldOption>
                  </FieldSelect>
                </div>
                <div>
                  <label className={labelClass}>{uiCopy("duration")}</label>
                  <input type="text" value={formData.duration || ""} onChange={(e) => set("duration", e.target.value)} className={inputClass} placeholder={uiCopy("eG30Days")} />
                </div>
              </div>
              <div>
                <label className={labelClass}>{uiCopy("steps")}</label>
                <textarea value={formData.steps || ""} onChange={(e) => set("steps", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{uiCopy("benefits")}</label>
                <textarea value={formData.benefits || ""} onChange={(e) => set("benefits", e.target.value)} rows={2} className={inputClass} />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">{uiCopy("cancel")}</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-purple-500 hover:bg-purple-600">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uiCopy("saving")}</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> {uiCopy("save")}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
