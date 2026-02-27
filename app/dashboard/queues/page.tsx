"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, RefreshCw, Phone } from "lucide-react";

interface QueueData {
  queue: string;
  domain: string;
  name?: string;
  waiting: number;
  agents: number;
  maxWaitTime: number;
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<QueueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = async () => {
    try {
      setError(null);
      const res = await fetch("/api/ns/queues");

      if (!res.ok) {
        throw new Error("Failed to fetch queues");
      }

      const data = await res.json();
      setQueues(data.queues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchQueues, 15000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTotalWaiting = () => {
    return queues.reduce((sum, q) => sum + q.waiting, 0);
  };

  const getTotalAgents = () => {
    return queues.reduce((sum, q) => sum + q.agents, 0);
  };

  const getAvgWaitTime = () => {
    if (queues.length === 0) return 0;
    const totalWait = queues.reduce((sum, q) => sum + q.maxWaitTime, 0);
    return Math.floor(totalWait / queues.length);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading queues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Queues</h1>
          <p className="text-slate-600 mt-1">
            {queues.length} active queue{queues.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchQueues}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Waiting</p>
              <p className="text-3xl font-bold text-slate-900">{getTotalWaiting()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Total Agents</p>
              <p className="text-3xl font-bold text-slate-900">{getTotalAgents()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Wait Time</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatTime(getAvgWaitTime())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Queues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {queues.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Phone className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No active queues found</p>
          </div>
        ) : (
          queues.map((queue, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
            >
              {/* Queue Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {queue.name || queue.queue}
                  </h3>
                  <p className="text-sm text-slate-600">{queue.domain}</p>
                </div>
                {queue.waiting > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {queue.waiting} waiting
                  </span>
                )}
              </div>

              {/* Queue Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Waiting</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {queue.waiting}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Agents</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {queue.agents}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Max Wait</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {Math.floor(queue.maxWaitTime / 60)}m
                  </p>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Performance</span>
                  <span
                    className={`font-medium ${
                      queue.waiting === 0
                        ? "text-green-600"
                        : queue.waiting < 5
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {queue.waiting === 0
                      ? "Excellent"
                      : queue.waiting < 5
                        ? "Good"
                        : "Needs Attention"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
