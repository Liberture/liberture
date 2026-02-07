"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";

type Comment = {
  id: string;
  contentId: string;
  author: string;
  avatarUrl: string;
  timeAgo: string;
  comment: string;
  helpful: number;
  replies: number;
};

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadComments = async () => {
    try {
      const res = await fetch("/api/platform-comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/admin/platform-comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadComments();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const filteredComments = comments.filter(
    (comment) =>
      comment.author.toLowerCase().includes(search.toLowerCase()) ||
      comment.comment.toLowerCase().includes(search.toLowerCase()) ||
      comment.contentId.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Content ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Author</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Comment</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Engagement</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredComments.map((comment) => (
                <tr key={comment.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {comment.contentId.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">{comment.author}</td>
                  <td className="px-4 py-3 text-sm max-w-md truncate">
                    {comment.comment}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {comment.timeAgo}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {comment.helpful} 👍 · {comment.replies} 💬
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(comment.id)}
                      className="hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredComments.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {search ? "No comments match your search" : "No comments found"}
        </div>
      )}
    </div>
  );
}
