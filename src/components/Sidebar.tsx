"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  Briefcase,
  BarChart3,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface UserSession {
  authenticated: boolean;
  role?: "ADMIN" | "STAFF";
  name?: string;
  email?: string;
  staffId?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  // Fetch current session role
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated) {
            setSession(data);
          }
        }
      } catch (err) {
        console.error("Sidebar auth check error:", err);
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Determine effective role:
  // If explicitly STAFF from session, or if path is /staff/* and not yet identified as admin, default role accordingly
  const isStaffMode = session?.role === "STAFF";

  // Navigation Items
  const adminNavItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Staff Dashboard",
      href: "/staff/dashboard",
      icon: BarChart3,
      active: pathname === "/staff/dashboard",
    },
    {
      name: "Staff Workspace",
      href: "/staff/workspace",
      icon: Briefcase,
      active: pathname.startsWith("/staff/workspace"),
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
      name: "Staff Team",
      href: "/staff",
      icon: UserCheck,
      active:
        pathname === "/staff" ||
        (pathname.startsWith("/staff") &&
          !pathname.startsWith("/staff/workspace") &&
          !pathname.startsWith("/staff/dashboard")),
    },
  ];

  // In Staff Mode: cx, cx registration, and staff team are REMOVED!
  // Only Staff Dashboard and Staff Workspace are available
  const staffNavItems = [
    {
      name: "Staff Dashboard",
      href: "/staff/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/staff/dashboard",
    },
    {
      name: "Staff Workspace",
      href: "/staff/workspace",
      icon: Briefcase,
      active: pathname.startsWith("/staff/workspace"),
    },
  ];

  const navItems = isStaffMode ? staffNavItems : adminNavItems;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
      const targetLogin = isStaffMode ? "/login?role=staff" : "/login?role=admin";
      router.push(targetLogin);
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
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-400 font-normal">
                  {isStaffMode ? "Staff Portal" : "Admin CRM"}
                </span>
                {isStaffMode && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E86328]/20 text-[#E86328] border border-[#E86328]/30">
                    STAFF
                  </span>
                )}
              </div>
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
                      ? "bg-[#E86328] text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon size={18} className="opacity-90 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Logout & Role Indicator */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <div
                className={`w-2 h-2 rounded-full ${
                  isStaffMode ? "bg-[#E86328]" : "bg-emerald-400"
                }`}
              />
              <span className="truncate">
                {isStaffMode
                  ? `Staff: ${session?.name || "Member"}`
                  : "Admin Mode"}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 shrink-0">v1.1</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-xs text-slate-300 font-medium transition-colors border border-slate-700/60"
          >
            <LogOut size={14} />
            <span>
              {loggingOut
                ? "Signing out..."
                : isStaffMode
                ? "Sign out Staff"
                : "Sign out Admin"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
