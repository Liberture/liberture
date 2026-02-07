"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

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

type Props = {
  article: KnowledgeArticle | null;
  onClose: () => void;
  onSave: () => void;
};

const PILLARS = ["Cognition", "Recovery", "Fueling", "Mental", "Physicality", "Finance"];

export default function KnowledgeEditModal({ article, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pillar: "Cognition",
    tags: "",
    author: "",
    readTime: 5,
    url: "",
    publishedAt: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        publishedAt: new Date(article.publishedAt).toISOString().split("T")[0],
      });
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = article
        ? `/api/admin/knowledge/${article.id}`
        : "/api/admin/knowledge";
      const method = article ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          publishedAt: new Date(formData.publishedAt).toISOString(),
        }),
      });

      if (res.ok) {
        onSave();
      } else {
        alert("Failed to save article");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {article ? "Edit Article" : "Add New Article"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-800/50 border-slate-700"
              required
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-slate-800/50 border-slate-700 min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pillar</Label>
              <Select
                value={formData.pillar}
                onValueChange={(value) =>
                  setFormData({ ...formData, pillar: value })
                }
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILLARS.map((pillar) => (
                    <SelectItem key={pillar} value={pillar}>
                      {pillar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Read Time (minutes)</Label>
              <Input
                type="number"
                value={formData.readTime}
                onChange={(e) =>
                  setFormData({ ...formData, readTime: Number(e.target.value) })
                }
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="nootropics, supplements, focus"
              className="bg-slate-800/50 border-slate-700"
            />
          </div>

          <div>
            <Label>Author</Label>
            <Input
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="bg-slate-800/50 border-slate-700"
              required
            />
          </div>

          <div>
            <Label>URL</Label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
              className="bg-slate-800/50 border-slate-700"
              required
            />
          </div>

          <div>
            <Label>Published Date</Label>
            <Input
              type="date"
              value={formData.publishedAt}
              onChange={(e) =>
                setFormData({ ...formData, publishedAt: e.target.value })
              }
              className="bg-slate-800/50 border-slate-700"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
