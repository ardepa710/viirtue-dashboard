"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Search, Download, RefreshCw, Mail, Phone, Shield } from "lucide-react";

interface VoipUser {
  title: string;
  name: string;
  domain: string;
  extension: string;
  callerId: string;
  email: string;
  voicemail: boolean;
  scope: string;
}

const SCOPE_COLORS: Record<string, string> = {
  "Office Manager": "bg-purple-100 text-purple-800",
  "Basic User": "bg-slate-100 text-slate-700",
  "Reseller": "bg-blue-100 text-blue-800",
  "Super User": "bg-orange-100 text-orange-800",
  "Domain Admin": "bg-red-100 text-red-800",
};

export default function VoipUsersPage() {
  const [users, setUsers] = useState<VoipUser[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedScope, setSelectedScope] = useState("");

  useEffect(() => {
    fetch("/api/reports/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setDomains(data.domains ?? []);
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (selectedDomain && u.domain !== selectedDomain) return false;
      if (selectedScope && u.scope !== selectedScope) return false;
      if (q && !u.name.toLowerCase().includes(q) &&
              !u.extension.includes(q) &&
              !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, selectedDomain, selectedScope]);

  const scopes = useMemo(() => Array.from(new Set(users.map((u) => u.scope))).filter(Boolean).sort(), [users]);

  const handleExport = () => {
    const headers = ["Name", "Domain", "Extension", "Caller ID", "Email", "Voicemail", "Scope"];
    const csv = [
      headers.join(","),
      ...filtered.map((u) =>
        [u.name, u.domain, u.extension, u.callerId, u.email, u.voicemail ? "Yes" : "No", u.scope]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `voip-users-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">VoIP Users</h1>
          <p className="text-slate-600 mt-1">
            {isLoading ? "Loading..." : `${filtered.length} of ${users.length} users`}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Users</p>
          <p className="text-3xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Domains</p>
          <p className="text-3xl font-bold text-slate-900">{domains.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">With Voicemail</p>
          <p className="text-3xl font-bold text-slate-900">{users.filter((u) => u.voicemail).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Filtered</p>
          <p className="text-3xl font-bold text-blue-600">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, extension, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Domains</option>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Scopes</option>
            {scopes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Domain</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Ext</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">VM</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      No users match your filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                            {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span className="font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{user.domain}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-900">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.extension}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {user.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={user.email}>
                              {user.email.split(";")[0]}
                            </span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.voicemail ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {user.voicemail ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${SCOPE_COLORS[user.scope] ?? "bg-slate-100 text-slate-700"}`}>
                          <Shield className="w-3 h-3" />
                          {user.scope || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
