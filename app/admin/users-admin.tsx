"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, UserCog, Shield } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  bosLevel: number;
  banned: boolean;
  banReason?: string;
  createdAt: string;
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleBan = async (userId: string, reason: string) => {
    if (!reason) {
      reason = prompt("Ban reason:") || "No reason provided";
    }
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unban`, {
        method: "POST",
      });
      
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const handleImpersonate = async (userId: string) => {
    if (!confirm("Impersonate this user? You will be logged in as them.")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: "POST",
      });
      
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Failed to impersonate user:", error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Name</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Email</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Role</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">BOS Level</th>
                <th className="px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Status</th>
                <th className="px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline">{user.bosLevel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-400">
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      {user.banned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnban(user.id)}
                          className="hover:bg-green-500/20 hover:text-green-300"
                          title="Unban user"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBan(user.id, "")}
                          className="hover:bg-red-500/20 hover:text-red-300"
                          title="Ban user"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleImpersonate(user.id)}
                        className="hover:bg-purple-500/20 hover:text-purple-300"
                        title="Impersonate user"
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          {search ? "No users match your search" : "No users found"}
        </div>
      )}
    </div>
  );
}
