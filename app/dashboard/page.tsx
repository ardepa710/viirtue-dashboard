import { nsApi } from "@/lib/ns-api";
import { getCachedOrFetch, CACHE_TTL } from "@/lib/cache";
import { Phone, Users, Activity, Clock } from "lucide-react";

async function getOverviewData() {
  try {
    // Fetch data with caching
    const [activeCalls, queues, presence] = await Promise.all([
      getCachedOrFetch(
        "ns:active-calls",
        () => nsApi.getActiveCalls(),
        CACHE_TTL.LIVE_CALLS
      ),
      getCachedOrFetch(
        "ns:queues",
        () => nsApi.getQueues(),
        CACHE_TTL.QUEUES
      ),
      getCachedOrFetch(
        "ns:presence",
        () => nsApi.getPresence(),
        CACHE_TTL.PRESENCE
      ),
    ]);

    return {
      activeCalls,
      queues,
      presence,
    };
  } catch (error) {
    console.error("Failed to fetch overview data:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getOverviewData();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900 mb-2">
            Failed to load dashboard data
          </p>
          <p className="text-sm text-slate-600">
            Please check your NetSapiens API configuration
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: "Active Calls",
      value: data.activeCalls.length,
      icon: Phone,
      color: "bg-blue-500",
      description: "Calls in progress",
    },
    {
      name: "Call Queues",
      value: data.queues.length,
      icon: Users,
      color: "bg-purple-500",
      description: "Active queues",
    },
    {
      name: "Agents Online",
      value: data.presence.filter((p: any) => p.status === "available").length,
      icon: Activity,
      color: "bg-green-500",
      description: "Available agents",
    },
    {
      name: "Avg Wait Time",
      value: "2m 15s",
      icon: Clock,
      color: "bg-orange-500",
      description: "Average queue wait",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-600 mt-1">Real-time VoIP infrastructure metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {stat.name}
                </p>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {data.activeCalls.slice(0, 5).map((call: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {call.from} → {call.to}
                  </p>
                  <p className="text-xs text-slate-600">
                    {call.direction} • {call.status}
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-600">
                {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, "0")}
              </div>
            </div>
          ))}
          {data.activeCalls.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No active calls at the moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
