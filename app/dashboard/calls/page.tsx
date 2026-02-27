"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Pause, ArrowRightLeft, RefreshCw } from "lucide-react";
import type { NsActiveCall } from "@/types/ns-api";

export default function ActiveCallsPage() {
  const [calls, setCalls] = useState<NsActiveCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      setError(null);
      const res = await fetch("/api/ns/calls");

      if (!res.ok) {
        throw new Error("Failed to fetch calls");
      }

      const data = await res.json();
      setCalls(data.calls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();

    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchCalls, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async (callId: string) => {
    if (!confirm("Are you sure you want to disconnect this call?")) {
      return;
    }

    setActionLoading(callId);
    try {
      const res = await fetch(`/api/ns/calls/${callId}/disconnect`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect call");
      }

      // Refresh calls list
      await fetchCalls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect call");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHold = async (callId: string) => {
    setActionLoading(callId);
    try {
      const res = await fetch(`/api/ns/calls/${callId}/hold`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to hold call");
      }

      await fetchCalls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to hold call");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransfer = async (callId: string) => {
    const destination = prompt("Enter transfer destination:");
    if (!destination) return;

    setActionLoading(callId);
    try {
      const res = await fetch(`/api/ns/calls/${callId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination }),
      });

      if (!res.ok) {
        throw new Error("Failed to transfer call");
      }

      await fetchCalls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to transfer call");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "ringing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "inbound":
        return "↓";
      case "outbound":
        return "↑";
      default:
        return "↔";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading active calls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Calls</h1>
          <p className="text-slate-600 mt-1">
            {calls.length} call{calls.length !== 1 ? "s" : ""} in progress
          </p>
        </div>
        <button
          onClick={fetchCalls}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Calls Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Phone className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No active calls at the moment</p>
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.callId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          call.status
                        )}`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {call.from}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {call.to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        {getDirectionIcon(call.direction)} {call.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-mono">
                      {formatDuration(call.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleHold(call.callId)}
                          disabled={actionLoading === call.callId}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition disabled:opacity-50"
                          title="Hold"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTransfer(call.callId)}
                          disabled={actionLoading === call.callId}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          title="Transfer"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDisconnect(call.callId)}
                          disabled={actionLoading === call.callId}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Disconnect"
                        >
                          <PhoneOff className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
