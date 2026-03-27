"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, UserCog, Shield, ExternalLink, Loader2, Crown, Copy, Check, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// The hardcoded admin pubkeys
const ADMIN_PUBKEYS_HEX = [
  "d9590d95a7811e1cb312be66edd664d7e3e6ed57822ad9f213ed620fc6748be8",
  "419b7df0b0701bc75c7a105722549dd16220c41f51e79d92b7697d6e7124181a",
];

type User = {
  id: string;
  email: string | null;
  name: string;
  role: string;
  bosLevel: number;
  banned: boolean;
  banReason?: string;
  nostrPubkey: string | null;
  npub: string | null;
  createdAt: string;
  isSystemAdmin?: boolean;
};

type NostrProfile = {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  user: { label: "User", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" },
  contributor: { label: "Contributor", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  moderator: { label: "Moderator", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  admin: { label: "Admin", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedNpub, setCopiedNpub] = useState<string | null>(null);
  const [nostrProfiles, setNostrProfiles] = useState<Record<string, NostrProfile>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const copyNpub = async (npub: string) => {
    await navigator.clipboard.writeText(npub);
    setCopiedNpub(npub);
    setTimeout(() => setCopiedNpub(null), 2000);
  };

  const loadNostrProfiles = async (userList: User[]) => {
    const pubkeys = userList
      .map((u) => u.nostrPubkey)
      .filter((pk): pk is string => !!pk);
    if (pubkeys.length === 0) return;

    try {
      const res = await fetch("/api/admin/nostr-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkeys }),
      });
      const data = await res.json();
      setNostrProfiles(data.profiles || {});
    } catch (error) {
      console.error("Failed to load Nostr profiles:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      const userList = (data.users || []).map((u: User) => ({
        ...u,
        isSystemAdmin: u.nostrPubkey ? ADMIN_PUBKEYS_HEX.includes(u.nostrPubkey) : false,
      }));
      setUsers(userList);
      loadNostrProfiles(userList);
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
    setSavingRole(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        ));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setSavingRole(null);
    }
  };

  const truncateNpub = (npub: string) => {
    return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
  };

  const filteredUsers = users.filter((user) => {
    const s = search.toLowerCase();
    const nostrProfile = user.nostrPubkey ? nostrProfiles[user.nostrPubkey] : null;
    return (
      user.npub?.toLowerCase().includes(s) ||
      user.name?.toLowerCase().includes(s) ||
      user.email?.toLowerCase().includes(s) ||
      nostrProfile?.display_name?.toLowerCase().includes(s) ||
      nostrProfile?.name?.toLowerCase().includes(s) ||
      nostrProfile?.nip05?.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, npub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Badge variant="outline" className="text-slate-400">
          {users.length} users
        </Badge>
      </div>

      <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Nostr Identity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">BOS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    {(() => {
                      const nostrProfile = user.nostrPubkey ? nostrProfiles[user.nostrPubkey] : null;
                      const displayName = nostrProfile?.display_name || nostrProfile?.name || user.name || "Anonymous";
                      const profilePic = nostrProfile?.picture;
                      return (
                        <div className="flex items-center gap-3">
                          {profilePic ? (
                            <img
                              src={profilePic}
                              alt={displayName}
                              className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                          ) : null}
                          <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${profilePic ? "hidden" : ""}`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {displayName}
                            </div>
                            {nostrProfile?.nip05 && (
                              <div className="text-xs text-purple-400 truncate">{nostrProfile.nip05}</div>
                            )}
                            <div className="text-xs text-slate-500">
                              {user.email && <span>{user.email} &middot; </span>}
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {user.npub ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyNpub(user.npub!)}
                          className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded hover:bg-purple-500/20 transition-colors cursor-pointer"
                          title="Click to copy npub"
                        >
                          <code>{truncateNpub(user.npub)}</code>
                          {copiedNpub === user.npub ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </button>
                        <a
                          href={`https://njump.me/${user.npub}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-purple-400"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No Nostr identity</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.isSystemAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-yellow-400" />
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                          System Admin
                        </Badge>
                      </div>
                    ) : (
                      <Select
                        value={user.role || "user"}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={savingRole === user.id}
                      >
                        <SelectTrigger className={`h-7 w-[130px] text-xs rounded-lg border ${ROLE_CONFIG[user.role || "user"]?.border || "border-slate-700"} ${ROLE_CONFIG[user.role || "user"]?.bg || "bg-slate-800/50"} ${ROLE_CONFIG[user.role || "user"]?.color || "text-slate-300"} focus:ring-1 focus:ring-purple-500 focus:ring-offset-0`}>
                          {savingRole === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_CONFIG).map(([value, config]) => (
                            <SelectItem key={value} value={value} className={`text-xs ${config.color}`}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {user.bosLevel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.banned ? (
                      <Badge variant="destructive" className="text-xs">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500 text-green-400">
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {user.banned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnban(user.id)}
                          className="h-8 w-8 p-0 hover:bg-green-500/20 hover:text-green-300"
                          title="Unban user"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      ) : (
                        !user.isSystemAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleBan(user.id, "")}
                            className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-300"
                            title="Ban user"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )
                      )}
                      {!user.isSystemAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleImpersonate(user.id)}
                          className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-300"
                          title="Impersonate user"
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      )}
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
