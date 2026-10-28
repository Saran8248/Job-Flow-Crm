"use client";

import React, { Suspense } from "react";
import { JobStreamAuthPage } from "@/components/JobStreamAuthPage";

export default function CandidateLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs font-mono text-slate-400">
          Loading JobStream Live Portal...
        </div>
      }
    >
      <JobStreamAuthPage initialRole="candidate" />
    </Suspense>
  );
}
