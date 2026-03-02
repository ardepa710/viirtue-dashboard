"use client";

import { useEffect, useState, useMemo } from "react";
import { Hash, Search, Download, RefreshCw, ArrowRight, CheckCircle, XCircle } from "lucide-react";

interface VoipNumber {
  title: string;
  phoneNumber: string;
  treatment: string;
  destination: string;
  status: boolean;
  domain: string;
}

const TREATMENT_COLORS: Record<string, string> = {
  "User": "bg-blue-100 text-blue-800",
  "Available": "bg-green-100 text-green-800",
};

export default function VoipNumbersPage() {
  const [numbers, setNumbers] = useState<VoipNumber[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    fetch("/api/reports/numbers")
      .then((r) => r.json())
      .then((data) => {
        setNumbers(data.numbers ?? []);
        setDomains(data.domains ?? []);
      })
      .catch(() => setError("Failed to load numbers"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().replace(/\D/g, "");
    const qText = search.toLowerCase();
    return numbers.filter((n) => {
      if (selectedDomain && n.domain !== selectedDomain) return false;
      if (selectedTreatment && n.treatment !== selectedTreatment) return false;
      if (selectedStatus === "active" && !n.status) return false;
      if (selectedStatus === "inactive" && n.status) return false;
      if (search) {
        const numMatch = q && n.phoneNumber.includes(q);
        const destMatch = n.destination.toLowerCase().includes(qText);
        if (!numMatch && !destMatch) return false;
      }
      return true;
    });
  }, [numbers, search, selectedDomain, selectedTreatment, selectedStatus]);

  const treatments = useMemo(() => Array.from(new Set(numbers.map((n) => n.treatment))).filter(Boolean).sort(), [numbers]);

  const handleExport = () => {
    const headers = ["Phone Number", "Treatment", "Destination", "Status", "Domain"];
    const csv = [
      headers.join(","),
      ...filtered.map((n) =>
        [n.phoneNumber, n.treatment, n.destination, n.status ? "Active" : "Inactive", n.domain]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `voip-numbers-${Date.now()}.csv`;
    a.click();
  };

  const formatPhone = (num: string) => {
    const d = num.replace(/\D/g, "");
    if (d.length === 11 && d[0] === "1") {
      return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    }
    if (d.length === 10) {
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }
    return num;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">VoIP Numbers</h1>
          <p className="text-slate-600 mt-1">
            {isLoading ? "Loading..." : `${filtered.length} of ${numbers.length} numbers`}
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
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Numbers</p>
          <p className="text-3xl font-bold text-slate-900">{numbers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{numbers.filter((n) => n.status).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Inactive</p>
          <p className="text-3xl font-bold text-red-500">{numbers.filter((n) => !n.status).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Filtered</p>
          <p className="text-3xl font-bold text-blue-600">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search number or destination..."
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
            value={selectedTreatment}
            onChange={(e) => setSelectedTreatment(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Treatments</option>
            {treatments.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Phone Number</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Treatment</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Destination</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Domain</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      <Hash className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      No numbers match your filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((num, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-slate-900">
                          {formatPhone(num.phoneNumber)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TREATMENT_COLORS[num.treatment] ?? "bg-slate-100 text-slate-700"}`}>
                          {num.treatment}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-700 font-mono text-xs">
                          <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          {num.destination}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{num.domain}</td>
                      <td className="px-4 py-3">
                        {num.status ? (
                          <span className="flex items-center gap-1 text-green-700 font-medium text-xs">
                            <CheckCircle className="w-4 h-4" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium text-xs">
                            <XCircle className="w-4 h-4" /> Inactive
                          </span>
                        )}
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
