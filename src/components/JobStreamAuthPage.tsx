"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Radio, Zap } from "lucide-react";
import { JobStreamBackground } from "@/components/JobStreamBackground";
import { UnifiedLoginCard, RoleType } from "@/components/UnifiedLoginCard";

interface JobStreamAuthPageProps {
  initialRole?: RoleType;
}

export function JobStreamAuthPage({ initialRole = "candidate" }: JobStreamAuthPageProps) {
  // Prevent outer body scroll while on login view
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow || "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#0B0F17] text-slate-100 flex flex-col justify-between selection:bg-[#E86328]/30 selection:text-[#E86328]">
      {/* Background Live Moving Feed (50% visibility, Right-to-Left) */}
      <JobStreamBackground />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-3 shrink-0 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-xs select-none">
        {/* Brand Logo with 3 orange bars */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#E86328] flex flex-col justify-center items-center gap-[2.5px] p-1.5 shadow-md shadow-orange-950/40 group-hover:scale-105 transition-transform">
            <span className="w-full h-[2.5px] bg-white rounded-full"></span>
            <span className="w-full h-[2.5px] bg-white rounded-full"></span>
            <span className="w-full h-[2.5px] bg-white rounded-full"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white leading-none">
              JobStream
            </span>
            <span className="text-[9.5px] text-[#E86328] font-mono font-semibold tracking-wider">
              BY JOBASSIST
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <nav className="flex items-center gap-6 text-xs font-semibold text-slate-300">
            <span className="cursor-default hover:text-white transition-colors">Portals</span>
            <span className="cursor-default hover:text-white transition-colors">Companies</span>
            <span className="cursor-default hover:text-white transition-colors">Alerts</span>
          </nav>

          {/* Live stream indicator badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111827] border border-slate-700/80 text-[11px] font-mono text-slate-300 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400">2,418 Live Roles</span>
          </div>
        </div>
      </header>

      {/* Main Container: Professionally aligned and evenly centered, no clipping */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-2 sm:py-4 flex-1 flex items-center justify-center overflow-y-auto lg:overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center w-full my-auto">
          {/* ========================================================= */}
          {/* LEFT HERO: HEADLINE & LIVE FEED HIGHLIGHT                 */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center pr-0 lg:pr-6 select-none">
            {/* Live Feed Status Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111927]/90 border border-slate-700/80 text-[10.5px] font-mono uppercase tracking-widest text-slate-300 w-fit mb-3.5 shadow-xs">
              <Radio size={12} className="text-[#34D399] animate-pulse" />
              <span>Live feed, real-time stream</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[54px] font-serif font-normal tracking-tight text-white leading-[1.08] mb-4">
              Every opening, <br />
              <span className="text-[#E86328] italic font-serif">one moving feed.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mb-5">
              Job portals and company career pages in a single stream. Search once and see new roles as they appear.
            </p>

            {/* Live Stream Pulse Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0F172A]/90 border border-slate-800 text-xs text-slate-300 w-fit backdrop-blur-xs">
              <Zap size={14} className="text-[#E86328] shrink-0" />
              <span>Continuous right-to-left live sync across verified portals and career sites.</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: ANIMATED 3-WAY LOGIN (UNIFIED ORANGE & BLACK) */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center w-full py-1">
            <UnifiedLoginCard initialRole={initialRole} />
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-2.5 shrink-0 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-1.5 select-none">
        <span>&copy; {new Date().getFullYear()} JobAssist Technologies. Real-time career CRM & application pipeline.</span>
        <div className="flex items-center gap-4">
          <Link href="/portal/login" className="hover:text-[#E86328] transition-colors">Candidate Access</Link>
          <Link href="/login?role=staff" className="hover:text-[#E86328] transition-colors">Staff CRM</Link>
          <Link href="/login?role=admin" className="hover:text-[#E86328] transition-colors">Master Admin</Link>
        </div>
      </footer>
    </div>
  );
}
