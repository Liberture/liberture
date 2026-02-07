"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import KnowledgeEditModal from "./knowledge-edit-modal";

type KnowledgeArticle = {
  id: string;
  title: string;
  description: string;
  pillar: string;
  tags: string;
  author: string;
  readTime: number;
  url: string;
  publishedAt: string;
};

export default function KnowledgeAdmin() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editArticle, setEditArticle] = useState<KnowledgeArticle | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadArticles = async () => {
    try {
      const res = await fetch("/api/knowledge");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Failed to load articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadArticles();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setEditArticle(article);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditArticle(null);
    setShowModal(true);
  };

  const handleSave = () => {
    loadArticles();
    setShowModal(false);
  };

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.pillar.toLowerCase().includes(search.toLowerCase()) ||
      article.author.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search knowledge articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Button>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Pillar</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Author</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Read Time</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm">{article.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                      {article.pillar}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{article.author}</td>
                  <td className="px-4 py-3 text-sm">{article.readTime} min</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(article)}
                        className="hover:bg-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(article.id)}
                        className="hover:bg-red-500/20 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {search ? "No articles match your search" : "No articles found"}
        </div>
      )}

      {showModal && (
        <KnowledgeEditModal
          article={editArticle}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
