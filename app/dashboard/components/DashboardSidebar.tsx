"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Phone,
  Users,
  FileText,
  Settings,
  Activity,
  BarChart2,
  Hash,
} from "lucide-react";

const mainNav = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Active Calls", href: "/dashboard/calls", icon: Phone },
  { name: "Queues", href: "/dashboard/queues", icon: Users },
  { name: "CDR Reports", href: "/dashboard/cdr", icon: FileText },
  { name: "Audit Logs", href: "/dashboard/audit", icon: Activity },
];

const reportsNav = [
  { name: "VoIP Users", href: "/dashboard/reports/users", icon: Users },
  { name: "VoIP Numbers", href: "/dashboard/reports/numbers", icon: Hash },
];

const bottomNav = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: { name: string; href: string; icon: any } }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">Viirtue</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {mainNav.map((item) => <NavLink key={item.href} item={item} />)}

        {/* Reports Section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-4 mb-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports</span>
          </div>
          {reportsNav.map((item) => <NavLink key={item.href} item={item} />)}
        </div>

        <div className="pt-2">
          {bottomNav.map((item) => <NavLink key={item.href} item={item} />)}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800 text-sm text-slate-400">
        <p>NetSapiens VoIP</p>
        <p>Dashboard v1.0</p>
      </div>
    </aside>
  );
}
