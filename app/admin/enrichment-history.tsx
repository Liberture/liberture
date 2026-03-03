"use client";

import { useState, useEffect } from "react";
import { Clock, Sparkles, User } from "lucide-react";

interface EnrichmentLog {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  fieldsAdded: string;
  source: string;
  enrichedBy: string | null;
  createdAt: string;
}

export default function EnrichmentHistory() {
  const [logs, setLogs] = useState<EnrichmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  async function fetchLogs() {
    try {
      const url = filter
        ? `/api/admin/enrichment-log?entityType=${filter}`
        : `/api/admin/enrichment-log`;
      const response = await fetch(url);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const sourceColors = {
    manual: "bg-blue-500/20 text-blue-400",
    ai: "bg-purple-500/20 text-purple-400",
    bulk: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Enrichment History</h2>
            <p className="text-sm text-slate-400">Track all enrichment activities</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filter === null
              ? "bg-purple-500 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All
        </button>
        {["people", "books", "organizations", "protocols"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === type
                ? "bg-purple-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          No enrichment history yet
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            let fieldsAdded: string[] = [];
            try {
              fieldsAdded = log.fieldsAdded ? JSON.parse(log.fieldsAdded) : [];
            } catch {
              fieldsAdded = [log.fieldsAdded || "unknown"];
            }
            return (
              <div
                key={log.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      <span className="font-semibold text-white">
                        {log.entityName}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded capitalize">
                        {log.entityType}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 space-y-1">
                      <div>
                        <span className="text-slate-500">Fields added:</span>{" "}
                        {fieldsAdded.join(", ")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.enrichedBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.enrichedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      sourceColors[log.source as keyof typeof sourceColors] ||
                      "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {log.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
