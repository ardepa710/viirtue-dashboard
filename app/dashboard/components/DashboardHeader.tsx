"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import type { User as SessionUser } from "next-auth";

export default function DashboardHeader({ user }: { user: SessionUser }) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-900">{user.name}</p>
            <p className="text-slate-600">{user.email}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
