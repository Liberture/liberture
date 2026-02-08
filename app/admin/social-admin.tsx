"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Search } from "lucide-react";

type SocialPost = {
  id: string;
  author: string;
  avatarUrl: string;
  timeAgo: string;
  content: string;
  likes: number;
  comments: number;
};

export default function SocialAdmin() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPosts = async () => {
    try {
      const res = await fetch("/api/social-posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/admin/social-posts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadPosts();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.author.toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search social posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Post
        </Button>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Author</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Content</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Engagement</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm">{post.author}</td>
                  <td className="px-4 py-3 text-sm max-w-md truncate">
                    {post.content}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{post.timeAgo}</td>
                  <td className="px-4 py-3 text-sm">
                    {post.likes} ❤️ · {post.comments} 💬
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(post.id)}
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

      {filteredPosts.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {search ? "No posts match your search" : "No posts found"}
        </div>
      )}
    </div>
  );
}
