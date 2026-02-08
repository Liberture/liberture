"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Sparkles, ExternalLink } from "lucide-react";

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
}

export default function DirectoryAdmin() {
  const [activeType, setActiveType] = useState<DirectoryType>("people");
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<DirectoryItem | null>(null);

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
    // Call enrichment API (to be implemented)
    alert(`Enrichment for ${item.name || item.title} coming soon!`);
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
      {/* Type Selector */}
      <div className="flex gap-2">
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

      {/* Edit Modal (placeholder) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Edit {getDisplayName(editingItem)}
            </h2>
            <p className="text-slate-400 mb-4">Edit form coming soon...</p>
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
