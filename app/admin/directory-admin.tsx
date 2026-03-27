"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Sparkles, ExternalLink, Zap, Loader2, X, Save } from "lucide-react";
import { EditPersonModal } from "./edit-person-modal";
import { Button } from "@/components/ui/button";

type DirectoryType = "people" | "books" | "organizations" | "protocols" | "articles";

interface DirectoryItem {
  id: string;
  slug: string;
  name?: string;
  title?: string;
  author?: string;
  bio?: string;
  description?: string;
  pillars?: string;
  pillar?: string;
  wikipedia?: string | null;
  publications?: string | null;
  speakingEvents?: string | null;
  website?: string | null;
  image?: string | null;
  // Article fields
  tags?: string;
  readTime?: number;
  url?: string;
  content?: string;
  publishedAt?: string;
  // Book fields
  year?: number;
  imageUrl?: string | null;
  amazonUrl?: string | null;
  goodreadsUrl?: string | null;
  // Organization fields
  type?: string;
  founded?: string;
  resources?: string | null;
  keyPeople?: string | null;
  // Protocol fields
  creator?: string;
  duration?: string;
  difficulty?: string;
  steps?: string;
  benefits?: string;
  risks?: string | null;
  equipment?: string | null;
  references?: string | null;
  published?: boolean;
}

const DIRECTORY_TYPES: DirectoryType[] = ["people", "books", "organizations", "protocols", "articles"];

export default function DirectoryAdmin() {
  const [activeType, setActiveType] = useState<DirectoryType>("people");
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<DirectoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeType]);

  async function fetchItems() {
    setLoading(true);
    try {
      const response = await fetch(`/api/${activeType}?all=true`);
      const data = await response.json();
      setItems(data[activeType] || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  }

  async function enrichItem(item: DirectoryItem) {
    try {
      const response = await fetch('/api/admin/enrich-queue', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeType,
          id: item.id,
          name: item.name || item.title,
          priority: 'normal',
        }),
      });

      if (!response.ok) throw new Error("Failed to queue enrichment");

      const data = await response.json();
      alert(`Added to enrichment queue!\n\nJob ID: ${data.jobId}\n\nWill be processed automatically by heartbeat.`);
    } catch (error) {
      console.error("Enrichment error:", error);
      alert("Failed to queue enrichment. Check console for details.");
    }
  }

  async function enrichAll() {
    const unenriched = filteredItems.filter(item => !hasEnrichmentData(item));

    if (!confirm(`Add ${unenriched.length} ${activeType} to enrichment queue?\n\nThey will be processed automatically in batches.`)) {
      return;
    }

    let queued = 0;
    for (const item of unenriched) {
      try {
        const response = await fetch('/api/admin/enrich-queue', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeType,
            id: item.id,
            name: item.name || item.title,
            priority: 'bulk',
          }),
        });

        if (response.ok) queued++;
      } catch (error) {
        console.error(`Failed to queue ${item.name || item.title}`, error);
      }
    }

    alert(`Queued ${queued} entries!\n\nThey will be enriched automatically during heartbeat checks.`);
  }

  async function saveItem(data: any) {
    const endpoint = activeType === "people"
      ? `/api/people/id/${data.id}`
      : `/api/${activeType}/id/${data.id}`;

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`Failed to save ${activeType.slice(0, -1)}`);

    fetchItems();
  }

  async function deleteItem(item: DirectoryItem) {
    if (!confirm(`Delete ${item.name || item.title}? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/${activeType}/id/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      fetchItems();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete entry");
    }
  }

  function getDisplayName(item: DirectoryItem): string {
    return item.name || item.title || "Unknown";
  }

  function hasEnrichmentData(item: DirectoryItem): boolean {
    return !!(item.wikipedia || item.publications || item.speakingEvents);
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
      {/* Type Selector & Bulk Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {DIRECTORY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                activeType === type
                  ? "bg-purple-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
          {activeType !== "articles" && (
            <button
              onClick={enrichAll}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Enrich All
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder={`Search ${activeType}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Items Count */}
      {!loading && (
        <p className="text-sm text-slate-400">
          {filteredItems.length} {activeType} {searchTerm && `matching "${searchTerm}"`}
        </p>
      )}

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">
                      {getDisplayName(item)}
                    </h3>
                    {hasEnrichmentData(item) && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Enriched
                      </span>
                    )}
                    {activeType === "articles" && item.readTime && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        {item.readTime} min read
                      </span>
                    )}
                    {item.wikipedia && (
                      <a
                        href={item.wikipedia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                        title="Wikipedia"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  {item.author && (
                    <p className="text-sm text-slate-400 mt-1">by {item.author}</p>
                  )}
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                    {item.bio || item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(item.pillars || item.pillar || "").split(",").filter(Boolean).map((pillar, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded"
                      >
                        {pillar.trim()}
                      </span>
                    ))}
                    {activeType === "articles" && item.tags && (
                      <>
                        {(Array.isArray(item.tags) ? item.tags : item.tags.split(",")).filter(Boolean).slice(0, 3).map((tag: string, i: number) => (
                          <span
                            key={`tag-${i}`}
                            className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded"
                          >
                            {typeof tag === 'string' ? tag.trim() : tag}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {activeType !== "articles" && (
                    <button
                      onClick={() => enrichItem(item)}
                      className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                      title="Enrich with AI"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteItem(item)}
                    className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400">
          No {activeType} found {searchTerm && `matching "${searchTerm}"`}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && activeType === "people" && (
        <EditPersonModal
          person={editingItem as any}
          onClose={() => setEditingItem(null)}
          onSave={async (person) => {
            await saveItem(person);
          }}
        />
      )}

      {editingItem && activeType !== "people" && (
        <EditDirectoryItemModal
          item={editingItem}
          type={activeType}
          onClose={() => setEditingItem(null)}
          onSave={async (data) => {
            await saveItem(data);
            setEditingItem(null);
          }}
        />
      )}

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
              fetchItems();
            } catch (error: any) {
              alert(`Failed: ${error.message}`);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Edit Directory Item Modal ───────────────────────────────────────────────

function EditDirectoryItemModal({
  item,
  type,
  onClose,
  onSave,
}: {
  item: DirectoryItem;
  type: DirectoryType;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({ ...item });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const labelClass = "block text-sm text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white capitalize">
            Edit {type.slice(0, -1)}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Article Fields ── */}
          {type === "articles" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input type="text" required value={formData.title || ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Author</label>
                  <input type="text" value={formData.author || ""} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Content (Markdown)</label>
                <textarea value={formData.content || ""} onChange={(e) => set("content", e.target.value)} rows={8} className={`${inputClass} font-mono`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Pillar</label>
                  <input type="text" value={formData.pillar || ""} onChange={(e) => set("pillar", e.target.value)} className={inputClass} placeholder="mind" />
                </div>
                <div>
                  <label className={labelClass}>Tags (comma-separated)</label>
                  <input type="text" value={Array.isArray(formData.tags) ? formData.tags.join(", ") : (formData.tags || "")} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Read Time (min)</label>
                  <input type="number" value={formData.readTime || ""} onChange={(e) => set("readTime", e.target.value)} className={inputClass} min="1" />
                </div>
              </div>
              <div>
                <label className={labelClass}>URL</label>
                <input type="text" value={formData.url || ""} onChange={(e) => set("url", e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* ── Book Fields ── */}
          {type === "books" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input type="text" required value={formData.title || ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Author *</label>
                  <input type="text" required value={formData.author || ""} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Pillars (comma-separated)</label>
                  <input type="text" value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Year</label>
                  <input type="number" value={formData.year || ""} onChange={(e) => set("year", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Rating</label>
                  <input type="number" step="0.1" value={formData.rating || ""} onChange={(e) => set("rating", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Wikipedia URL</label>
                  <input type="url" value={formData.wikipedia || ""} onChange={(e) => set("wikipedia", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Amazon URL</label>
                  <input type="url" value={formData.amazonUrl || ""} onChange={(e) => set("amazonUrl", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Goodreads URL</label>
                  <input type="url" value={formData.goodreadsUrl || ""} onChange={(e) => set("goodreadsUrl", e.target.value)} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {/* ── Organization Fields ── */}
          {type === "organizations" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <input type="text" value={formData.type || ""} onChange={(e) => set("type", e.target.value)} className={inputClass} placeholder="research, nonprofit..." />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pillars (comma-separated)</label>
                  <input type="text" value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Founded</label>
                  <input type="text" value={formData.founded || ""} onChange={(e) => set("founded", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={formData.website || ""} onChange={(e) => set("website", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Wikipedia</label>
                  <input type="url" value={formData.wikipedia || ""} onChange={(e) => set("wikipedia", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Key People (comma-separated)</label>
                <input type="text" value={formData.keyPeople || ""} onChange={(e) => set("keyPeople", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Image URL</label>
                <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* ── Protocol Fields ── */}
          {type === "protocols" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pillar</label>
                  <input type="text" value={formData.pillar || ""} onChange={(e) => set("pillar", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select value={formData.difficulty || "beginner"} onChange={(e) => set("difficulty", e.target.value)} className={inputClass}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input type="text" value={formData.duration || ""} onChange={(e) => set("duration", e.target.value)} className={inputClass} placeholder="e.g., 30 days" />
                </div>
                <div>
                  <label className={labelClass}>Creator</label>
                  <input type="text" value={formData.creator || ""} onChange={(e) => set("creator", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Steps</label>
                <textarea value={formData.steps || ""} onChange={(e) => set("steps", e.target.value)} rows={4} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Benefits</label>
                  <textarea value={formData.benefits || ""} onChange={(e) => set("benefits", e.target.value)} rows={3} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Risks</label>
                  <textarea value={formData.risks || ""} onChange={(e) => set("risks", e.target.value)} rows={3} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Equipment</label>
                <input type="text" value={formData.equipment || ""} onChange={(e) => set("equipment", e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Item Modal ──────────────────────────────────────────────────────────

function AddItemModal({
  type,
  onClose,
  onSave,
}: {
  type: DirectoryType;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const set = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const inputClass = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <h2 className="text-2xl font-bold mb-4 capitalize">Add New {type.slice(0, -1)}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── People ── */}
          {type === "people" && (
            <>
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bio</label>
                <textarea value={formData.bio || ""} onChange={(e) => set("bio", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={formData.website || ""} onChange={(e) => set("website", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pillars (comma-separated) *</label>
                <input type="text" required value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} placeholder="sleep, nutrition, mind" />
              </div>
            </>
          )}

          {/* ── Articles ── */}
          {type === "articles" && (
            <>
              <div>
                <label className={labelClass}>Title *</label>
                <input type="text" required value={formData.title || ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Content (Markdown)</label>
                <textarea value={formData.content || ""} onChange={(e) => set("content", e.target.value)} rows={6} className={`${inputClass} font-mono`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Author</label>
                  <input type="text" value={formData.author || ""} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Read Time (min)</label>
                  <input type="number" value={formData.readTime || "5"} onChange={(e) => set("readTime", e.target.value)} className={inputClass} min="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pillar *</label>
                  <input type="text" required value={formData.pillar || ""} onChange={(e) => set("pillar", e.target.value)} className={inputClass} placeholder="mind" />
                </div>
                <div>
                  <label className={labelClass}>Tags (comma-separated)</label>
                  <input type="text" value={formData.tags || ""} onChange={(e) => set("tags", e.target.value)} className={inputClass} placeholder="sleep, melatonin" />
                </div>
              </div>
              <div>
                <label className={labelClass}>URL (optional, auto-generated if empty)</label>
                <input type="text" value={formData.url || ""} onChange={(e) => set("url", e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          {/* ── Books ── */}
          {type === "books" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input type="text" required value={formData.title || ""} onChange={(e) => set("title", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Author *</label>
                  <input type="text" required value={formData.author || ""} onChange={(e) => set("author", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Year</label>
                  <input type="number" value={formData.year || ""} onChange={(e) => set("year", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Pillars (comma-separated) *</label>
                <input type="text" required value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} placeholder="sleep, nutrition, mind" />
              </div>
            </>
          )}

          {/* ── Organizations ── */}
          {type === "organizations" && (
            <>
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <input type="text" value={formData.type || ""} onChange={(e) => set("type", e.target.value)} className={inputClass} placeholder="research, nonprofit..." />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input type="url" value={formData.website || ""} onChange={(e) => set("website", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Image URL</label>
                <input type="url" value={formData.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pillars (comma-separated) *</label>
                <input type="text" required value={formData.pillars || ""} onChange={(e) => set("pillars", e.target.value)} className={inputClass} placeholder="sleep, nutrition, mind" />
              </div>
            </>
          )}

          {/* ── Protocols ── */}
          {type === "protocols" && (
            <>
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" required value={formData.name || ""} onChange={(e) => set("name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea required value={formData.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Pillar *</label>
                  <input type="text" required value={formData.pillar || ""} onChange={(e) => set("pillar", e.target.value)} className={inputClass} placeholder="mind" />
                </div>
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select value={formData.difficulty || "beginner"} onChange={(e) => set("difficulty", e.target.value)} className={inputClass}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input type="text" value={formData.duration || ""} onChange={(e) => set("duration", e.target.value)} className={inputClass} placeholder="e.g., 30 days" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Steps</label>
                <textarea value={formData.steps || ""} onChange={(e) => set("steps", e.target.value)} rows={3} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Benefits</label>
                <textarea value={formData.benefits || ""} onChange={(e) => set("benefits", e.target.value)} rows={2} className={inputClass} />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-purple-500 hover:bg-purple-600">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Save</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
