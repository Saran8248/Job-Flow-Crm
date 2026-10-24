"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, ChevronRight, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { STAGES, STAGE_LIST, StageKey } from "@/lib/types";
import { ClientModal } from "@/components/ClientModal";
import { ClientDrawer } from "@/components/ClientDrawer";

interface SummaryData {
  activeClients: number;
  applicationsToday: number;
  interviewsSecured: number;
  renewalsDue: number;
}

interface PipelineClient {
  id: string;
  name: string;
  targetRole: string;
  planDurationMonths: number;
  staffName: string;
  currentStage: string;
}

interface TodayProgressItem {
  id: string;
  name: string;
  currentStage: string;
  todayApps: number;
  dailyTarget: number;
  totalApps: number;
}

interface RecruiterInboxItem {
  id: string;
  recruiterOrCompany: string;
  subject: string;
  preview: string;
  type: string;
  receivedAt: string;
  client?: {
    id: string;
    name: string;
  } | null;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning, team");
  const [summary, setSummary] = useState<SummaryData>({
    activeClients: 0,
    applicationsToday: 0,
    interviewsSecured: 0,
    renewalsDue: 0,
  });
  const [pipeline, setPipeline] = useState<Record<StageKey, { count: number; clients: PipelineClient[] }>>({
    CONFIRMED: { count: 0, clients: [] },
    PAID: { count: 0, clients: [] },
    DETAILS_COLLECTED: { count: 0, clients: [] },
    DOCUMENTS_APPROVED: { count: 0, clients: [] },
    PORTAL_SETUP: { count: 0, clients: [] },
    APPLICATIONS_IN_PROGRESS: { count: 0, clients: [] },
    FOLLOW_UP: { count: 0, clients: [] },
    REPORT: { count: 0, clients: [] },
    RENEWED_CLOSED: { count: 0, clients: [] },
  });
  const [todayProgress, setTodayProgress] = useState<TodayProgressItem[]>([]);
  const [recruiterInbox, setRecruiterInbox] = useState<RecruiterInboxItem[]>([]);

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setGreeting(data.greeting || "Good morning, team");
        setSummary(data.summary);
        if (data.pipeline) setPipeline(data.pipeline);
        if (data.todayProgress) setTodayProgress(data.todayProgress);
        if (data.recruiterInbox) setRecruiterInbox(data.recruiterInbox);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 lg:p-10 font-sans">
      {/* 4.1 Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#182232]">
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-[#EAE5DC] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E86328] hover:bg-[#D2541C] text-white text-sm font-medium shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>New client</span>
          </button>
        </div>
      </div>

      {/* 4.2 Summary Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Active Clients */}
        <div
          onClick={() => (window.location.href = "/clients")}
          className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs hover:border-[#DDD6C9] cursor-pointer transition-all"
        >
          <p className="text-xs font-normal text-[#717B8A] mb-1">
            Active clients
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-[#182232] tracking-tight">
            {summary.activeClients}
          </p>
        </div>

        {/* Card 2: Applications Today */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs hover:border-[#DDD6C9] transition-all">
          <p className="text-xs font-normal text-[#717B8A] mb-1">
            Applications today
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-[#182232] tracking-tight">
            {summary.applicationsToday}
          </p>
        </div>

        {/* Card 3: Interviews Secured */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs hover:border-[#DDD6C9] transition-all">
          <p className="text-xs font-normal text-[#717B8A] mb-1">
            Interviews secured
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-[#182232] tracking-tight">
            {summary.interviewsSecured}
          </p>
        </div>

        {/* Card 4: Renewals Due */}
        <div
          onClick={() => (window.location.href = "/clients?filter=renewals")}
          className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs hover:border-[#DDD6C9] cursor-pointer transition-all"
        >
          <p className="text-xs font-normal text-[#717B8A] mb-1">
            Renewals due
          </p>
          <p className="text-3xl lg:text-4xl font-bold text-[#182232] tracking-tight">
            {summary.renewalsDue}
          </p>
        </div>
      </div>

      {/* 4.3 Client Pipeline */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#182232] mb-3">
          Client pipeline
        </h2>

        {/* Horizontal scroll container */}
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-flow-col auto-cols-[170px] xl:auto-cols-[1fr] gap-3 min-w-[1250px]">
            {STAGE_LIST.map((stageKey) => {
              const stageInfo = STAGES[stageKey];
              const stageData = pipeline[stageKey] || { count: 0, clients: [] };

              return (
                <div
                  key={stageKey}
                  className="bg-[#F3EFE6]/60 rounded-xl p-3 border border-[#EAE5DC]/80 flex flex-col min-h-[160px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-0.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-[#717B8A] truncate">
                      {stageInfo.label}
                    </span>
                    <span className="text-[11px] font-semibold text-[#717B8A]">
                      {stageData.count}
                    </span>
                  </div>

                  {/* Client Cards inside Stage */}
                  <div className="space-y-2 flex-1">
                    {stageData.clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:shadow-sm hover:border-[#E86328]/40 cursor-pointer transition-all"
                      >
                        <h4 className="text-xs font-bold text-[#182232] leading-tight truncate">
                          {client.name}
                        </h4>
                        <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                          {client.targetRole}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#9BA3AF] flex items-center justify-between">
                          <span>{client.planDurationMonths} {client.planDurationMonths === 1 ? "Month" : "Months"}</span>
                          <span className="truncate max-w-[70px] text-right">· {client.staffName}</span>
                        </div>
                      </div>
                    ))}
                    {stageData.clients.length === 0 && (
                      <div className="h-full flex items-center justify-center text-[11px] text-[#B8AF9F] italic py-6">
                        No clients
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Side-by-Side Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4.4 Today's Application Progress (approx 65% = 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-[#182232]">
              Today's application progress
            </h3>
            <span className="text-xs text-[#717B8A]">
              Real-time daily tracker
            </span>
          </div>

          <div className="space-y-5">
            {todayProgress.map((item) => {
              const stageConfig = STAGES[item.currentStage as StageKey] || {
                label: item.currentStage,
                pillBg: "bg-gray-100",
                pillText: "text-gray-700",
              };
              const percent = Math.min(
                100,
                Math.round((item.todayApps / (item.dailyTarget || 60)) * 100)
              );

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 py-1"
                >
                  {/* Client name & stage */}
                  <div className="md:col-span-4">
                    <button
                      onClick={() => setSelectedClientId(item.id)}
                      className="text-xs font-bold text-[#182232] hover:text-[#E86328] text-left transition-colors truncate block max-w-full"
                    >
                      {item.name}
                    </button>
                    <div className="mt-1">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${stageConfig.pillBg} ${stageConfig.pillText}`}
                      >
                        {stageConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar (7 cols) */}
                  <div className="md:col-span-7">
                    <div className="w-full bg-[#EAE5DC]/60 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#E86328] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Fraction text (1 col) */}
                  <div className="md:col-span-1 text-right text-xs font-semibold text-[#182232]">
                    {item.todayApps}/{item.dailyTarget}
                  </div>
                </div>
              );
            })}

            {todayProgress.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No active application tracking records for today yet.
              </div>
            )}
          </div>
        </div>

        {/* 4.5 Recruiter Inbox (approx 35% = 4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-[#EAE5DC] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F1EBE1]">
              <h3 className="text-sm font-semibold text-[#182232]">
                Recruiter Inbox
              </h3>
              <span className="text-[11px] text-[#717B8A]">
                Latest updates
              </span>
            </div>

            <div className="divide-y divide-[#F1EBE1]">
              {recruiterInbox.map((item) => {
                let badgeStyle = "bg-gray-100 text-gray-700";
                if (item.type === "ASSESSMENT") badgeStyle = "bg-amber-50 text-amber-700 border border-amber-200";
                if (item.type === "INTERVIEW") badgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                if (item.type === "REJECTION") badgeStyle = "bg-rose-50 text-rose-700 border border-rose-200";
                if (item.type === "ACKNOWLEDGED") badgeStyle = "bg-blue-50 text-blue-700 border border-blue-200";

                return (
                  <div
                    key={item.id}
                    onClick={() => item.client?.id && setSelectedClientId(item.client.id)}
                    className="py-3 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/60 rounded px-1 -mx-1 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#182232] truncate">
                        {item.recruiterOrCompany}
                      </div>
                      <div className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {item.subject}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeStyle}`}
                    >
                      {item.type}
                    </span>
                  </div>
                );
              })}

              {recruiterInbox.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No recruiter communications logged yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-[#F1EBE1] text-right">
            <button
              onClick={() => (window.location.href = "/clients")}
              className="text-xs font-medium text-[#E86328] hover:underline inline-flex items-center gap-1"
            >
              <span>View all client communications</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <ClientDrawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onUpdate={() => fetchDashboardData()}
      />
    </div>
  );
}
