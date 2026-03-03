"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Loader2, UserPlus, Clock, UserCheck, UserX } from "lucide-react";

type CollaborationRequest = {
  id: string;
  npub: string;
  pubkeyHex: string;
  message: string | null;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
};

type RequestCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

export default function CollaborationRequests() {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [counts, setCounts] = useState<RequestCounts>({ pending: 0, approved: 0, rejected: 0 });

  const loadRequests = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/collaboration-requests?status=${status}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
  }, [statusFilter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/collaboration-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Refresh the list
        loadRequests(statusFilter);
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const truncateNpub = (npub: string) => {
    return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Status Tabs with Counts */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {counts.pending > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-yellow-500/20 text-yellow-400">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Approved
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-green-500/20 text-green-400">
              {counts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <UserX className="h-4 w-4" />
            Rejected
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-red-500/20 text-red-400">
              {counts.rejected}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No {statusFilter} requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">npub</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Message</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  {statusFilter === "pending" && (
                    <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                  )}
                  {statusFilter !== "pending" && (
                    <th className="px-4 py-3 text-left text-sm font-semibold">Reviewed</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <a
                        href={`https://njump.me/${req.npub}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-purple-400 hover:underline"
                        title={req.npub}
                      >
                        {truncateNpub(req.npub)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                      {req.message || <span className="text-slate-500 italic">No message</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {formatDate(req.createdAt)}
                    </td>
                    {statusFilter === "pending" ? (
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleAction(req.id, "approve")}
                            disabled={actionLoading === req.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === req.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(req.id, "reject")}
                            disabled={actionLoading === req.id}
                            className="hover:bg-red-500/20 hover:text-red-300"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {req.reviewedAt ? formatDate(req.reviewedAt) : "-"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
