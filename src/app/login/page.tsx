"use client";

import React, { Suspense } from "react";
import { JobStreamAuthPage } from "@/components/JobStreamAuthPage";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs font-mono text-slate-400">
          Loading JobStream CRM Authentication...
        </div>
      }
    >
      <JobStreamAuthPage initialRole="admin" />
    </Suspense>
  );
}
