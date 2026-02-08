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

type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  pillar: string;
  type: string;
  author: string;
  rating: number;
  reviews: number;
  price: number;
  duration: string;
  color: string;
  iconColor: string;
};

type Props = {
  item: MarketplaceItem | null;
  onClose: () => void;
  onSave: () => void;
};

const PILLARS = ["Cognition", "Recovery", "Fueling", "Mental", "Physicality", "Finance"];
const TYPES = ["premium", "opensource"];

export default function MarketplaceEditModal({ item, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pillar: "Cognition",
    type: "premium",
    author: "",
    rating: 4.5,
    reviews: 0,
    price: 0,
    duration: "",
    color: "#8B5CF6",
    iconColor: "#A78BFA",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = item
        ? `/api/admin/marketplace/${item.id}`
        : "/api/admin/marketplace";
      const method = item ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
      } else {
        alert("Failed to save item");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {item ? "Edit Item" : "Add New Item"}
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
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>

            <div>
              <Label>Rating</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: Number(e.target.value) })
                }
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>

            <div>
              <Label>Reviews</Label>
              <Input
                type="number"
                value={formData.reviews}
                onChange={(e) =>
                  setFormData({ ...formData, reviews: Number(e.target.value) })
                }
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>
          </div>

          <div>
            <Label>Duration</Label>
            <Input
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              placeholder="e.g., 8 weeks, 30 days"
              className="bg-slate-800/50 border-slate-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Color (hex)</Label>
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#8B5CF6"
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>

            <div>
              <Label>Icon Color (hex)</Label>
              <Input
                value={formData.iconColor}
                onChange={(e) =>
                  setFormData({ ...formData, iconColor: e.target.value })
                }
                placeholder="#A78BFA"
                className="bg-slate-800/50 border-slate-700"
                required
              />
            </div>
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
