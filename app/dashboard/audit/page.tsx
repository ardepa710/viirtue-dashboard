"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, Filter, ChevronLeft, ChevronRight, Shield } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user: {
    name: string;
    email: string;
  } | null;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchLogs = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("limit", limit.toString());
      params.set("offset", offset.toString());

      const res = await fetch(`/api/audit?${params.toString()}`);

      if (!res.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [action, startDate, endDate, limit, offset]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  const getActionColor = (actionType: string) => {
    if (actionType.includes("LOGIN")) return "bg-green-100 text-green-800";
    if (actionType.includes("LOGOUT")) return "bg-blue-100 text-blue-800";
    if (actionType.includes("CALL")) return "bg-purple-100 text-purple-800";
    if (actionType.includes("FAILED")) return "bg-red-100 text-red-800";
    return "bg-slate-100 text-slate-800";
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-600 mt-1">System activity and security events</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Action Type
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CALL_DISCONNECT">Call Disconnect</option>
              <option value="CALL_HOLD">Call Hold</option>
              <option value="CALL_TRANSFER">Call Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Records per page
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No audit logs found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const details = parseDetails(log.details);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.user ? (
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {log.user.name}
                                </p>
                                <p className="text-xs text-slate-600">{log.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">System</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                                log.action
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {log.resource || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                            {details ? (
                              <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing {offset + 1} to {offset + logs.length} records
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={logs.length < limit}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
