"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Clients",
      href: "/clients",
      icon: Users,
      active: pathname.startsWith("/clients"),
    },
    {
      name: "Cx Registration",
      href: "/registrations",
      icon: UserPlus,
      active: pathname.startsWith("/registrations"),
    },
    {
      name: "Staff",
      href: "/staff",
      icon: UserCheck,
      active: pathname.startsWith("/staff"),
    },
  ];

  const handleAdminLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger toggle */}
      <div className="lg:hidden fixed top-3 left-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-[#131926] text-white shadow-md focus:outline-none focus:ring-2 focus:ring-[#E86328]"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-60 bg-[#131926] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="px-6 py-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E86328] flex items-center justify-center font-bold text-white text-lg shadow-sm">
              J
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[17px] tracking-tight text-white leading-tight">
                JobAssist
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Admin CRM
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 mt-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-[#E86328] text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon size={18} className="opacity-90" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Admin Mode</span>
            </div>
            <span className="text-[11px] text-slate-500">v1.1</span>
          </div>

          <button
            onClick={handleAdminLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs text-slate-300 font-medium transition-colors border border-slate-700/60"
          >
            <LogOut size={14} />
            <span>{loggingOut ? "Signing out..." : "Sign out Admin"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
