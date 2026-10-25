"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck2,
  LogOut,
} from "lucide-react";

export default function CandidatePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/portal/login";

  const [candidate, setCandidate] = useState<{
    id: string;
    name: string;
    email: string;
    targetRole: string;
  } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoginPage) {
      fetch("/api/portal/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.candidate) {
            setCandidate(data.candidate);
          }
        })
        .catch(() => {});
    }
  }, [isLoginPage]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/portal/auth/logout", { method: "POST" });
      router.push("/portal/login");
      router.refresh();
    } catch {
      router.push("/portal/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navLinks = [
    {
      name: "Dashboard",
      href: "/portal",
      icon: LayoutDashboard,
      active: pathname === "/portal",
    },
    {
      name: "My Applications",
      href: "/portal/applications",
      icon: Briefcase,
      active: pathname === "/portal/applications",
    },
    {
      name: "Interviews & Tests",
      href: "/portal/interviews",
      icon: CalendarCheck2,
      active: pathname === "/portal/interviews",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Candidate Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Candidate View Tag */}
            <div className="flex items-center gap-3">
              <Link href="/portal" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-[#E86328] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                  J
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                      JobAssist
                    </span>
                    <span className="bg-orange-100 text-[#E86328] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Candidate Portal
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 hidden sm:block">
                    Your personal job search cockpit
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      item.active
                        ? "bg-[#E86328] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action: Candidate Profile & Logout */}
            <div className="flex items-center gap-3">
              {candidate && (
                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
                    {candidate.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                      {candidate.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                      {candidate.targetRole}
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                title="Sign out of Candidate Portal"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium ${
                item.active ? "text-[#E86328] font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
