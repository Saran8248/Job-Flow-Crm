"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  ChevronRight,
  MessageSquare,
  Clock,
  ArrowRight,
  Users,
  CreditCard,
  Briefcase,
  FileCheck2,
  CalendarCheck2,
  CheckCircle2,
  Layers,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { STAGES, STAGE_LIST, StageKey } from "@/lib/types";
import { ClientModal } from "@/components/ClientModal";
import { ClientDrawer } from "@/components/ClientDrawer";

interface SummaryData {
  wholeCxCount: number;
  paidCount: number;
  ongoingJobsCount: number;
  assessmentCount: number;
  interviewCount: number;
  closureCount: number;
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

interface CxAnalysisData {
  wholeCx: {
    key: string;
    title: string;
    count: number;
    description: string;
    clients: any[];
  };
  paid: {
    key: string;
    title: string;
    count: number;
    description: string;
    clients: any[];
  };
  ongoingJobs: {
    key: string;
    title: string;
    count: number;
    description: string;
    clients: any[];
  };
  assessment: {
    key: string;
    title: string;
    count: number;
    clientCount?: number;
    description: string;
    clients: any[];
  };
  interview: {
    key: string;
    title: string;
    count: number;
    clientCount?: number;
    description: string;
    clients: any[];
  };
  cxClosureList: {
    key: string;
    title: string;
    count: number;
    description: string;
    clients: any[];
  };
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
    wholeCxCount: 0,
    paidCount: 0,
    ongoingJobsCount: 0,
    assessmentCount: 0,
    interviewCount: 0,
    closureCount: 0,
    activeClients: 0,
    applicationsToday: 0,
    interviewsSecured: 0,
    renewalsDue: 0,
  });

  // Cx Analysis state
  const [cxAnalysis, setCxAnalysis] = useState<CxAnalysisData | null>(null);
  const [analysisViewMode, setAnalysisViewMode] = useState<"cxAnalysis" | "stages">("cxAnalysis");

  // 9-Stage Pipeline state
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
        if (data.cxAnalysis) setCxAnalysis(data.cxAnalysis);
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
          <p className="text-xs text-[#717B8A] mt-1">
            Real-time client lifecycle analysis, active job pipelines, assessments, and interview tracker.
          </p>
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

      {/* 4.2 Cx Analyze Summary Cards (6 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {/* 1. Whole Cx Count */}
        <div
          onClick={() => {
            setAnalysisViewMode("cxAnalysis");
            window.location.href = "#cx-analysis-section";
          }}
          className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs hover:border-[#E86328]/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-[11px] font-medium">Whole Cx</span>
            <Users size={15} className="text-blue-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-[#182232] tracking-tight">
            {summary.wholeCxCount || summary.activeClients}
          </p>
          <span className="text-[10px] text-[#9BA3AF] mt-0.5 block truncate">
            Total Enrolled
          </span>
        </div>

        {/* 2. Paid */}
        <div
          onClick={() => {
            setAnalysisViewMode("cxAnalysis");
            window.location.href = "#cx-analysis-section";
          }}
          className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs hover:border-[#E86328]/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-[11px] font-medium">Paid Cx</span>
            <CreditCard size={15} className="text-emerald-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-[#182232] tracking-tight">
            {summary.paidCount}
          </p>
          <span className="text-[10px] text-[#9BA3AF] mt-0.5 block truncate">
            Fee Settled
          </span>
        </div>

        {/* 3. Ongoing Jobs */}
        <div
          onClick={() => {
            setAnalysisViewMode("cxAnalysis");
            window.location.href = "#cx-analysis-section";
          }}
          className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs hover:border-[#E86328]/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-[11px] font-medium">Ongoing Jobs</span>
            <Briefcase size={15} className="text-[#E86328]" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-[#182232] tracking-tight">
            {summary.ongoingJobsCount}
          </p>
          <span className="text-[10px] text-[#9BA3AF] mt-0.5 block truncate">
            Active Campaign
          </span>
        </div>

        {/* 4. Assessment Count */}
        <div
          onClick={() => {
            setAnalysisViewMode("cxAnalysis");
            window.location.href = "#cx-analysis-section";
          }}
          className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs hover:border-[#E86328]/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-[11px] font-medium">Assessments</span>
            <FileCheck2 size={15} className="text-purple-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-[#182232] tracking-tight">
            {summary.assessmentCount}
          </p>
          <span className="text-[10px] text-[#9BA3AF] mt-0.5 block truncate">
            Tests Scheduled
          </span>
        </div>

        {/* 5. Interviews */}
        <div
          onClick={() => {
            setAnalysisViewMode("cxAnalysis");
            window.location.href = "#cx-analysis-section";
          }}
          className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs hover:border-[#E86328]/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-[11px] font-medium">Interviews</span>
            <CalendarCheck2 size={15} className="text-teal-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-[#182232] tracking-tight">
            {summary.interviewCount || summary.interviewsSecured}
          </p>
          <span className="text-[10px] text-[#9BA3AF] mt-0.5 block truncate">
            Rounds Secured
          </span>
        </div>

        {/* 6. Cx Closure List */}
        <div
          onClick={() => {
            setAnalysisViewMode("cxAnalysis");
            window.location.href = "#cx-analysis-section";
          }}
          className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs hover:border-[#E86328]/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-[11px] font-medium">Cx Closure</span>
            <CheckCircle2 size={15} className="text-slate-600" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-[#182232] tracking-tight">
            {summary.closureCount}
          </p>
          <span className="text-[10px] text-[#9BA3AF] mt-0.5 block truncate">
            Closed / Renewals
          </span>
        </div>
      </div>

      {/* 4.3 Client Pipeline & Cx Analyze Section */}
      <div id="cx-analysis-section" className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#182232]">
              {analysisViewMode === "cxAnalysis" ? "Client Analysis (Cx Lifecycle)" : "Full 9-Stage Client Pipeline"}
            </h2>
            <span className="text-xs text-[#717B8A] hidden sm:inline">
              • Interactive candidate breakdown
            </span>
          </div>

          {/* Toggle between Cx Analysis and 9-Stage Pipeline */}
          <div className="flex items-center bg-[#EAE5DC]/60 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setAnalysisViewMode("cxAnalysis")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                analysisViewMode === "cxAnalysis"
                  ? "bg-white text-[#E86328] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 size={14} />
              <span>Cx Analysis View</span>
            </button>
            <button
              onClick={() => setAnalysisViewMode("stages")}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                analysisViewMode === "stages"
                  ? "bg-white text-[#E86328] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers size={14} />
              <span>9-Stage Pipeline</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: CX ANALYSIS VIEW (Whole Cx Count, Paid, Ongoing Jobs, Assessment, Interview, Cx Closure) */}
        {analysisViewMode === "cxAnalysis" && cxAnalysis && (
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-flow-col auto-cols-[230px] lg:auto-cols-[1fr] gap-4 min-w-[1380px]">
              {/* Column 1: WHOLE CX COUNT */}
              <div className="bg-[#F3EFE6]/70 rounded-xl p-3.5 border border-[#EAE5DC] flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#EAE5DC]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Whole Cx Count
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {cxAnalysis.wholeCx.count}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Total candidate pool</p>
                <div className="space-y-2 flex-1">
                  {cxAnalysis.wholeCx.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:border-[#E86328] cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-bold text-[#182232] truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {c.targetRole}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                        <span>{c.planDurationMonths}M Plan</span>
                        <span className="font-medium text-slate-700">· {c.staffName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: PAID CLIENTS */}
              <div className="bg-[#F3EFE6]/70 rounded-xl p-3.5 border border-[#EAE5DC] flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#EAE5DC]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Paid
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {cxAnalysis.paid.count}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Fee verified & confirmed</p>
                <div className="space-y-2 flex-1">
                  {cxAnalysis.paid.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:border-[#E86328] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#182232] truncate">
                          {c.name}
                        </h4>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {c.targetRole}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                        <span className="text-emerald-700 font-semibold">₹{(c.amountPaid || 0).toLocaleString()} Paid</span>
                        <span className="font-medium text-slate-700">· {c.staffName}</span>
                      </div>
                    </div>
                  ))}
                  {cxAnalysis.paid.clients.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-6">
                      No paid clients
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: ONGOING JOBS */}
              <div className="bg-[#F3EFE6]/70 rounded-xl p-3.5 border border-[#EAE5DC] flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#EAE5DC]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Ongoing Jobs
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {cxAnalysis.ongoingJobs.count}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Active application progress</p>
                <div className="space-y-2 flex-1">
                  {cxAnalysis.ongoingJobs.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:border-[#E86328] cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-bold text-[#182232] truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {c.targetRole}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                        <span className="text-[#E86328] font-bold">{c.totalApps} Applied</span>
                        <span className="font-medium text-slate-700">· {c.staffName}</span>
                      </div>
                    </div>
                  ))}
                  {cxAnalysis.ongoingJobs.clients.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-6">
                      No ongoing job applications
                    </div>
                  )}
                </div>
              </div>

              {/* Column 4: ASSESSMENT COUNT */}
              <div className="bg-[#F3EFE6]/70 rounded-xl p-3.5 border border-[#EAE5DC] flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#EAE5DC]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Assessment Count
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {cxAnalysis.assessment.count}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Technical tests scheduled</p>
                <div className="space-y-2 flex-1">
                  {cxAnalysis.assessment.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:border-[#E86328] cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-bold text-[#182232] truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {c.targetRole}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                        <span className="text-purple-700 font-bold">{c.assessmentsCount} Tests</span>
                        <span className="font-medium text-slate-700">· {c.staffName}</span>
                      </div>
                    </div>
                  ))}
                  {cxAnalysis.assessment.clients.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-6">
                      No assessments logged
                    </div>
                  )}
                </div>
              </div>

              {/* Column 5: INTERVIEWS */}
              <div className="bg-[#F3EFE6]/70 rounded-xl p-3.5 border border-[#EAE5DC] flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#EAE5DC]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Interview
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {cxAnalysis.interview.count}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Interviews confirmed & secured</p>
                <div className="space-y-2 flex-1">
                  {cxAnalysis.interview.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:border-[#E86328] cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-bold text-[#182232] truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {c.targetRole}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                        <span className="text-teal-700 font-bold">{c.interviewsCount} Rounds</span>
                        <span className="font-medium text-slate-700">· {c.staffName}</span>
                      </div>
                    </div>
                  ))}
                  {cxAnalysis.interview.clients.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-6">
                      No interviews secured yet
                    </div>
                  )}
                </div>
              </div>

              {/* Column 6: CX CLOSURE LIST */}
              <div className="bg-[#F3EFE6]/70 rounded-xl p-3.5 border border-[#EAE5DC] flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#EAE5DC]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Cx Closure List
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {cxAnalysis.cxClosureList.count}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">Service closure & renewal status</p>
                <div className="space-y-2 flex-1">
                  {cxAnalysis.cxClosureList.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:border-[#E86328] cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-bold text-[#182232] truncate">
                        {c.name}
                      </h4>
                      <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                        {c.targetRole}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                        <span className="text-slate-600 font-semibold">{c.currentStage}</span>
                        <span className="font-medium text-slate-700">· {c.staffName}</span>
                      </div>
                    </div>
                  ))}
                  {cxAnalysis.cxClosureList.clients.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 py-6">
                      <span>No closed clients</span>
                      <button
                        onClick={() => (window.location.href = "/clients")}
                        className="mt-2 text-[11px] text-[#E86328] hover:underline"
                      >
                        Close / Renew Client &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: 9-STAGE PIPELINE (With fixed comfortable spacing & badges) */}
        {analysisViewMode === "stages" && (
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-flow-col auto-cols-[210px] gap-3.5 min-w-[1900px]">
              {STAGE_LIST.map((stageKey) => {
                const stageInfo = STAGES[stageKey];
                const stageData = pipeline[stageKey] || { count: 0, clients: [] };

                return (
                  <div
                    key={stageKey}
                    className="bg-[#F3EFE6]/70 rounded-xl p-3 border border-[#EAE5DC] flex flex-col min-h-[170px]"
                  >
                    {/* Fixed Column Header with proper spacing and badge pill */}
                    <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-[#EAE5DC]">
                      <span className="text-xs font-bold tracking-wider uppercase text-slate-700 truncate pr-2">
                        {stageInfo.label}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E86328]/10 text-[#E86328] shrink-0">
                        {stageData.count}
                      </span>
                    </div>

                    {/* Client Cards inside Stage */}
                    <div className="space-y-2 flex-1">
                      {stageData.clients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          className="bg-white rounded-lg p-2.5 border border-[#EAE5DC] shadow-xs hover:shadow-sm hover:border-[#E86328] cursor-pointer transition-all"
                        >
                          <h4 className="text-xs font-bold text-[#182232] leading-tight truncate">
                            {client.name}
                          </h4>
                          <p className="text-[11px] text-[#717B8A] truncate mt-0.5">
                            {client.targetRole}
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-[#F1EBE1] text-[10px] text-[#717B8A] flex items-center justify-between">
                            <span>{client.planDurationMonths} {client.planDurationMonths === 1 ? "Month" : "Months"}</span>
                            <span className="font-medium text-slate-700 truncate">· {client.staffName}</span>
                          </div>
                        </div>
                      ))}
                      {stageData.clients.length === 0 && (
                        <div className="h-full flex items-center justify-center text-xs text-[#B8AF9F] italic py-6">
                          No clients
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Row 4: Side-by-Side Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4.4 Today's Application Progress (approx 65% = 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-[#182232]">
                Today's application progress
              </h3>
              <p className="text-xs text-[#717B8A] mt-0.5">
                Real-time daily target completion per candidate
              </p>
            </div>
            <span className="text-xs font-medium text-[#E86328] bg-orange-50 px-2.5 py-1 rounded-full">
              Live Progress
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
