"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide CRM Sidebar on all login/auth and candidate portal pages
  const isAuthPage =
    pathname === "/login" ||
    pathname?.startsWith("/login") ||
    pathname === "/portal/login" ||
    pathname?.startsWith("/portal/login");

  const isPortal = pathname?.startsWith("/portal");

  if (isAuthPage || isPortal) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-w-0 transition-all">
        {children}
      </main>
    </div>
  );
}
