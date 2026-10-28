"use client";

import React from "react";

interface JobRow {
  title: string;
  location: string;
  highlighted?: boolean;
}

interface WindowCardData {
  url: string;
  company: string;
  sourceType: "PORTAL" | "CAREERS";
  logoLetter: string;
  jobs: JobRow[];
}

const streamCardsRow1: WindowCardData[] = [
  {
    url: "jobwave.example/search",
    company: "Jobwave",
    sourceType: "PORTAL",
    logoLetter: "J",
    jobs: [
      { title: "Frontend Engineer", location: "Bengaluru · 1d", highlighted: true },
      { title: "Support Specialist", location: "Mumbai · 2d" },
      { title: "Finance Associate", location: "Gurugram · 5h" },
    ],
  },
  {
    url: "kestrelsystems.example/careers",
    company: "Kestrel Systems",
    sourceType: "CAREERS",
    logoLetter: "K",
    jobs: [
      { title: "QA Lead", location: "Chennai · 1d", highlighted: true },
      { title: "Cloud Architect", location: "Bengaluru · 12m" },
      { title: "Site Reliability Eng.", location: "Remote · 2h" },
    ],
  },
  {
    url: "worknest.example/listings",
    company: "WorkNest",
    sourceType: "PORTAL",
    logoLetter: "W",
    jobs: [
      { title: "Data Analyst", location: "Pune · 5h", highlighted: true },
      { title: "Product Designer", location: "Remote · 40m" },
      { title: "Android Developer", location: "Pune · 2d" },
    ],
  },
  {
    url: "cobaltfreight.example/careers",
    company: "Cobalt Freight",
    sourceType: "CAREERS",
    logoLetter: "C",
    jobs: [
      { title: "HR Business Partner", location: "Hyderabad · 40m" },
      { title: "Backend Developer", location: "Bengaluru · 3d", highlighted: true },
      { title: "Data Analyst", location: "Pune · 2d" },
    ],
  },
];

const streamCardsRow2: WindowCardData[] = [
  {
    url: "opendesk.example/jobs",
    company: "OpenDesk",
    sourceType: "PORTAL",
    logoLetter: "O",
    jobs: [
      { title: "ML Engineer", location: "Remote · 2h", highlighted: true },
      { title: "Support Specialist", location: "Mumbai · 3d" },
      { title: "DevOps Engineer", location: "Bengaluru · 1d" },
    ],
  },
  {
    url: "quillonbank.example/careers",
    company: "Quillon Bank",
    sourceType: "CAREERS",
    logoLetter: "Q",
    jobs: [
      { title: "Site Reliability Eng.", location: "Remote · 40m", highlighted: true },
      { title: "Android Developer", location: "Pune · 2d" },
      { title: "Finance Associate", location: "Gurugram · 6h" },
    ],
  },
  {
    url: "orbitly.example/careers",
    company: "Orbitly",
    sourceType: "CAREERS",
    logoLetter: "O",
    jobs: [
      { title: "Content Strategist", location: "Delhi · 5h" },
      { title: "Cloud Architect", location: "Bengaluru · 12m", highlighted: true },
      { title: "DevOps Engineer", location: "Bengaluru · 3d" },
    ],
  },
  {
    url: "rolefinder.example/careers",
    company: "Rolefinder",
    sourceType: "PORTAL",
    logoLetter: "R",
    jobs: [
      { title: "Finance Associate", location: "Chennai · 1d" },
      { title: "Data Analyst", location: "Pune · 2h", highlighted: true },
      { title: "Product Designer", location: "Remote · 1d" },
    ],
  },
];

const streamCardsRow3: WindowCardData[] = [
  {
    url: "jobwave.example/search",
    company: "Jobwave",
    sourceType: "PORTAL",
    logoLetter: "J",
    jobs: [
      { title: "Data Analyst", location: "Pune · 2h" },
      { title: "Product Designer", location: "Remote · 1d" },
      { title: "Frontend Engineer", location: "Bengaluru · 12m", highlighted: true },
    ],
  },
  {
    url: "cobaltfreight.example/careers",
    company: "Cobalt Freight",
    sourceType: "CAREERS",
    logoLetter: "C",
    jobs: [
      { title: "QA Lead", location: "Chennai · 2h", highlighted: true },
      { title: "Frontend Engineer", location: "Bengaluru · 40m" },
      { title: "Data Analyst", location: "Pune · 2d" },
    ],
  },
  {
    url: "kestrelsystems.example/careers",
    company: "Kestrel Systems",
    sourceType: "CAREERS",
    logoLetter: "K",
    jobs: [
      { title: "Cloud Architect", location: "Bengaluru · 15m", highlighted: true },
      { title: "Backend Developer", location: "Hyderabad · 1d" },
      { title: "QA Lead", location: "Chennai · 2d" },
    ],
  },
  {
    url: "worknest.example/listings",
    company: "WorkNest",
    sourceType: "PORTAL",
    logoLetter: "W",
    jobs: [
      { title: "Android Developer", location: "Pune · 2d", highlighted: true },
      { title: "Data Analyst", location: "Pune · 5h" },
      { title: "Product Designer", location: "Remote · 40m" },
    ],
  },
];

function WindowCard({ data }: { data: WindowCardData }) {
  return (
    <div className="w-[300px] sm:w-[325px] shrink-0 bg-[#0F1626] border border-[#24354D] rounded-xl p-2.5 sm:p-3 shadow-lg select-none">
      {/* Top Window Bar: Three Dots & Monospace URL */}
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#1E2C42]">
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        </div>
        <span className="text-[10px] font-mono text-slate-300 font-medium truncate">
          {data.url}
        </span>
      </div>

      {/* Company Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4.5 h-4.5 rounded bg-[#113B34] text-[#34D399] font-bold text-[10px] flex items-center justify-center border border-[#185348] shrink-0">
            {data.logoLetter}
          </div>
          <span className="text-xs font-bold text-white tracking-tight">{data.company}</span>
        </div>
        <span
          className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
            data.sourceType === "PORTAL"
              ? "bg-[#142033] text-slate-300 border-slate-700"
              : "bg-[#122822] text-[#34D399] border-[#185348]"
          }`}
        >
          {data.sourceType}
        </span>
      </div>

      {/* 3 Job Listings */}
      <div className="space-y-1">
        {data.jobs.map((job, idx) => (
          <div
            key={idx}
            className={`px-2 py-1 rounded-md text-[11px] flex items-center justify-between transition-colors ${
              job.highlighted
                ? "bg-[#0E332C] border border-[#165A4B] text-[#34D399] font-semibold"
                : "text-slate-300"
            }`}
          >
            <span className="truncate pr-1.5 font-medium">{job.title}</span>
            <span
              className={`text-[9px] shrink-0 font-mono ${
                job.highlighted ? "text-[#34D399]/90 font-semibold" : "text-slate-400"
              }`}
            >
              {job.location}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function JobStreamBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Ambient Radial Accent Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-950/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Streaming rows moving from RIGHT to LEFT at EXACT 50% VISIBILITY */}
      <div className="h-full w-full flex flex-col justify-around py-2 gap-3 opacity-50">
        {/* Row 1 - Moving Right to Left */}
        <div className="flex gap-4 w-max animate-stream-rtl">
          {[...streamCardsRow1, ...streamCardsRow1, ...streamCardsRow1].map((card, i) => (
            <WindowCard key={`row1-${i}`} data={card} />
          ))}
        </div>

        {/* Row 2 - Moving Right to Left (Staggered offset) */}
        <div className="flex gap-4 w-max animate-stream-rtl-slow -translate-x-28">
          {[...streamCardsRow2, ...streamCardsRow2, ...streamCardsRow2].map((card, i) => (
            <WindowCard key={`row2-${i}`} data={card} />
          ))}
        </div>

        {/* Row 3 - Moving Right to Left */}
        <div className="flex gap-4 w-max animate-stream-rtl-fast -translate-x-56">
          {[...streamCardsRow3, ...streamCardsRow3, ...streamCardsRow3].map((card, i) => (
            <WindowCard key={`row3-${i}`} data={card} />
          ))}
        </div>
      </div>

      {/* Clean subtle directional gradient: keeps text contrast while preserving 50% visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17]/70 via-transparent to-[#0B0F17]/60 pointer-events-none" />
    </div>
  );
}
