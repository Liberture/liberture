"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Sparkles, ExternalLink, Zap, Loader2 } from "lucide-react";
import { EditPersonModal } from "./edit-person-modal";
import { Button } from "@/components/ui/button";

type DirectoryType = "people" | "books" | "organizations" | "protocols";

interface DirectoryItem {
  id: string;
  slug: string;
  name?: string;
  title?: string;
  author?: string;
  bio?: string;
  description?: string;
  pillars: string;
  wikipedia?: string | null;
  publications?: string | null;
  speakingEvents?: string | null;
  website?: string | null;
  image?: string | null;
}

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
      const response = await fetch(`/api/${activeType}`);
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

      if (!response.ok) {
        throw new Error("Failed to queue enrichment");
      }

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

        if (response.ok) {
          queued++;
        }
      } catch (error) {
        console.error(`Failed to queue ${item.name || item.title}`, error);
      }
    }

    alert(`Queued ${queued} entries!\n\nThey will be enriched automatically during heartbeat checks.`);
  }

  async function savePerson(person: any) {
    const response = await fetch(`/api/people/id/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(person),
    });

    if (!response.ok) {
      throw new Error("Failed to save person");
    }

    fetchItems();
  }

  async function deleteItem(item: DirectoryItem) {
    if (!confirm(`Delete ${item.name || item.title}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${activeType}/id/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

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
    return name.includes(searchLower) || desc.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Type Selector & Bulk Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(["people", "books", "organizations", "protocols"] as DirectoryType[]).map((type) => (
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
          <button
            onClick={enrichAll}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Enrich All
          </button>
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
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {getDisplayName(item)}
                    </h3>
                    {hasEnrichmentData(item) && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Enriched
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
                  <div className="flex items-center gap-2 mt-2">
                    {item.pillars.split(",").map((pillar, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded"
                      >
                        {pillar.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => enrichItem(item)}
                    className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                    title="Enrich with AI"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
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
          onSave={savePerson}
        />
      )}

      {editingItem && activeType !== "people" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Edit {getDisplayName(editingItem)}
            </h2>
            <p className="text-slate-400 mb-4">
              Edit form for {activeType} coming soon...
            </p>
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
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

// Add Item Modal Component
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
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    title: "",
    author: "",
    bio: "",
    description: "",
    image: "",
    website: "",
    pillars: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data: any = {
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      pillars: formData.pillars,
    };

    if (type === "people") {
      data.name = formData.name;
      data.bio = formData.bio;
      data.imageUrl = formData.image;
      data.website = formData.website;
    } else if (type === "organizations") {
      data.name = formData.name;
      data.description = formData.description;
      data.imageUrl = formData.image;
      data.website = formData.website;
    } else if (type === "books") {
      data.title = formData.title;
      data.author = formData.author;
      data.description = formData.description;
      data.imageUrl = formData.image;
    } else if (type === "protocols") {
      data.name = formData.title || formData.name;
      data.description = formData.bio || formData.description;
      data.pillar = formData.pillars.split(",")[0]?.trim() || "mind";
    }

    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 capitalize">Add New {type.slice(0, -1)}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(type === "people" || type === "organizations") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          )}

          {(type === "books" || type === "protocols") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          )}

          {type === "books" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Author *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {type === "people" ? "Bio" : "Description"}
            </label>
            <textarea
              value={type === "people" ? formData.bio : formData.description}
              onChange={(e) => setFormData({
                ...formData,
                [type === "people" ? "bio" : "description"]: e.target.value
              })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="https://..."
            />
          </div>

          {(type === "people" || type === "organizations") && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                placeholder="https://..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Pillars (comma-separated) *
            </label>
            <input
              type="text"
              required
              value={formData.pillars}
              onChange={(e) => setFormData({ ...formData, pillars: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="sleep, nutrition, mind"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-purple-500 hover:bg-purple-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
