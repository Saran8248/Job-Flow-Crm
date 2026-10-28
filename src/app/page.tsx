"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Download,
  AlertTriangle,
  Maximize2,
  Image as ImageIcon,
  X,
  ShieldCheck,
  Target,
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
  activeStaffCount?: number;
  applicationsToday: number;
  targetsCompletedToday?: number;
  targetsMissedYesterday?: number;
  interviewsSecured: number;
  renewalsDue: number;
}

interface StaffPerformanceItem {
  id: string;
  name: string;
  role: string;
  email: string;
  assignedCxCount: number;
  appliedToday: number;
  totalDailyTarget: number;
  targetsCompleted: number;
  completionRate: number;
}

interface CxWorkspaceItem {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  staffName: string;
  staffId: string | null;
  dailyTarget: number;
  appliedToday: number;
  progressPercent: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "TARGET_DONE";
  lastAppTime: string | null;
  latestProofUrl: string | null;
  missedYesterday: boolean;
}

interface ApplicationFeedItem {
  id: string;
  companyName: string;
  jobTitle: string;
  portal?: string;
  status: string;
  proofImageUrl?: string | null;
  applicationDate: string;
  jobPostingUrl?: string;
  notes?: string;
  client?: {
    id: string;
    name: string;
    staff?: {
      id: string;
      name: string;
    } | null;
  };
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

  // Staff Workspace & Target Monitoring state
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformanceItem[]>([]);
  const [cxWorkspaceList, setCxWorkspaceList] = useState<CxWorkspaceItem[]>([]);
  const [recentApplicationsFeed, setRecentApplicationsFeed] = useState<ApplicationFeedItem[]>([]);
  const [cutOffAlerts, setCutOffAlerts] = useState<CxWorkspaceItem[]>([]);
  const [isPastCutoff, setIsPastCutoff] = useState<boolean>(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);

  // Filters for CX Target table
  const [cxStatusFilter, setCxStatusFilter] = useState<string>("ALL");
  const [cxStaffFilter, setCxStaffFilter] = useState<string>("ALL");
  const [cxSearch, setCxSearch] = useState<string>("");

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
        if (data.staffPerformance) setStaffPerformance(data.staffPerformance);
        if (data.cxWorkspaceList) setCxWorkspaceList(data.cxWorkspaceList);
        if (data.recentApplicationsFeed) setRecentApplicationsFeed(data.recentApplicationsFeed);
        if (data.cutOffAlerts) setCutOffAlerts(data.cutOffAlerts);
        if (data.isPastCutoff !== undefined) setIsPastCutoff(data.isPastCutoff);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExportCSV = () => {
    if (!cxWorkspaceList.length) return;
    const headers = [
      "Candidate Name",
      "Target Role",
      "Assigned Staff",
      "Daily Target",
      "Applied Today",
      "Target Completion %",
      "Status",
      "Last Application Time",
    ];
    const rows = cxWorkspaceList.map((c) => [
      `"${c.name}"`,
      `"${c.targetRole}"`,
      `"${c.staffName}"`,
      c.dailyTarget,
      c.appliedToday,
      `"${c.progressPercent}%"`,
      c.status,
      c.lastAppTime
        ? `"${new Date(c.lastAppTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}"`
        : '"None"',
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `jobassist_cx_target_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5DC] hover:border-[#E86328]/60 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            title="Open Staff Performance & Analytics Dashboard"
          >
            <BarChart3 size={14} className="text-[#E86328]" />
            <span>Staff Dashboard</span>
          </Link>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5DC] hover:border-[#E86328]/60 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            title="Export Candidate Targets & Progress to CSV"
          >
            <Download size={14} className="text-[#E86328]" />
            <span>Export CSV</span>
          </button>
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

      {/* 4.1.5 Cut-off Alert Banner (4 PM IST) */}
      {cutOffAlerts.length > 0 && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-4 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-600 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-amber-900">
                  4:00 PM Cut-off Alert: Incomplete Submissions Detected
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  {cutOffAlerts.length} Action Needed
                </span>
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {cutOffAlerts.length} assigned customer(s) have 0 applications recorded today. Please coordinate with assigned specialists to ensure daily quotas are fulfilled.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCxStatusFilter("NOT_STARTED");
              const el = document.getElementById("cx-target-management");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shrink-0 transition-colors"
          >
            Review CX
          </button>
        </div>
      )}

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

      {/* ======================================================== */}
      {/* 4.6 STAFF PERFORMANCE & CX TARGET OPERATIONS               */}
      {/* ======================================================== */}
      <div id="cx-target-management" className="mt-10 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE5DC]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg lg:text-xl font-bold tracking-tight text-[#182232]">
                Staff Performance & Daily Application Targets
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E86328]/10 text-[#E86328] border border-[#E86328]/30">
                Operations
              </span>
            </div>
            <p className="text-xs text-[#717B8A] mt-0.5">
              Monitor career specialists, assign external application quotas, inspect submission proofs, and verify daily goals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/staff/workspace"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0E1420] hover:bg-[#131B29] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Briefcase size={14} className="text-[#E86328]" />
              <span>Staff Workspace View</span>
            </a>
          </div>
        </div>

        {/* 5 Operations KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Total CX */}
          <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs">
            <div className="flex items-center justify-between text-[#717B8A] mb-1">
              <span className="text-xs font-medium">Total CX</span>
              <Users size={16} className="text-[#E86328]" />
            </div>
            <div className="text-2xl font-bold text-[#182232]">
              {summary.wholeCxCount || summary.activeClients}
            </div>
            <span className="text-[10px] text-[#9BA3AF] mt-0.5 block">
              Active candidates
            </span>
          </div>

          {/* Active Staff */}
          <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs">
            <div className="flex items-center justify-between text-[#717B8A] mb-1">
              <span className="text-xs font-medium">Active Staff</span>
              <ShieldCheck size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-[#182232]">
              {summary.activeStaffCount || staffPerformance.length || 2}
            </div>
            <span className="text-[10px] text-[#9BA3AF] mt-0.5 block">
              Career specialists
            </span>
          </div>

          {/* Applications Today */}
          <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs">
            <div className="flex items-center justify-between text-[#717B8A] mb-1">
              <span className="text-xs font-medium">Applied Today</span>
              <Target size={16} className="text-[#E86328]" />
            </div>
            <div className="text-2xl font-bold text-[#182232]">
              {summary.applicationsToday}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
              Verified with proof
            </span>
          </div>

          {/* Targets Met Today */}
          <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs">
            <div className="flex items-center justify-between text-[#717B8A] mb-1">
              <span className="text-xs font-medium">Targets Met Today</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {summary.targetsCompletedToday || 0}
            </div>
            <span className="text-[10px] text-[#9BA3AF] mt-0.5 block">
              Completed 100% target
            </span>
          </div>

          {/* Targets Missed Yesterday */}
          <div className="bg-white rounded-xl p-4 border border-[#EAE5DC] shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-[#717B8A] mb-1">
              <span className="text-xs font-medium">Missed Yesterday</span>
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {summary.targetsMissedYesterday || 0}
            </div>
            <span className="text-[10px] text-[#9BA3AF] mt-0.5 block">
              Below daily quota
            </span>
          </div>
        </div>

        {/* Staff Performance Table */}
        <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EAE5DC] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#182232]">
                Career Specialist Performance & Workload
              </h3>
              <p className="text-xs text-[#717B8A] mt-0.5">
                Daily application velocity and customer target completion rate per staff member
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {staffPerformance.length} Specialists
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#717B8A] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5DC]">
                <tr>
                  <th className="py-3 px-5">Staff Member</th>
                  <th className="py-3 px-5">Assigned Customers</th>
                  <th className="py-3 px-5">Applications Today</th>
                  <th className="py-3 px-5">Target Completion Rate</th>
                  <th className="py-3 px-5">Targets Met</th>
                  <th className="py-3 px-5 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {staffPerformance.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E86328] text-white font-bold flex items-center justify-center text-xs">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-[#182232] block">
                            {s.name}
                          </span>
                          <span className="text-[11px] text-[#717B8A]">
                            {s.role} • {s.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-[#182232]">
                      {s.assignedCxCount} Candidates
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-[#182232]">
                        {s.appliedToday}{" "}
                        <span className="text-[11px] font-normal text-[#717B8A]">
                          / {s.totalDailyTarget} target
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="w-36">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                          <span className="text-[#182232]">{s.completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              s.completionRate >= 100
                                ? "bg-emerald-500"
                                : s.completionRate > 0
                                ? "bg-[#E86328]"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${s.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>{s.targetsCompleted} CX Completed</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <a
                        href={`/staff/workspace`}
                        className="text-xs font-semibold text-[#E86328] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </a>
                    </td>
                  </tr>
                ))}

                {staffPerformance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No active staff records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Target Progress & Proof Inspection Table */}
        <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EAE5DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#182232]">
                Customer Target Tracker & Proof Verification
              </h3>
              <p className="text-xs text-[#717B8A] mt-0.5">
                Detailed customer daily target progress, assigned specialists, and proof inspection
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="Search candidate or role..."
                value={cxSearch}
                onChange={(e) => setCxSearch(e.target.value)}
                className="px-3 py-1.5 text-xs border border-[#EAE5DC] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328] w-48"
              />

              <select
                value={cxStaffFilter}
                onChange={(e) => setCxStaffFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-[#EAE5DC] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#E86328] cursor-pointer"
              >
                <option value="ALL">All Staff</option>
                {staffPerformance.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-lg border border-[#EAE5DC] p-0.5 bg-[#FAF7F2]">
                {[
                  { key: "ALL", label: "All" },
                  { key: "TARGET_DONE", label: "Done" },
                  { key: "IN_PROGRESS", label: "Active" },
                  { key: "NOT_STARTED", label: "Pending" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setCxStatusFilter(t.key)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${
                      cxStatusFilter === t.key
                        ? "bg-white text-[#182232] shadow-xs"
                        : "text-[#717B8A] hover:text-[#182232]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#717B8A] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5DC]">
                <tr>
                  <th className="py-3 px-5">Candidate</th>
                  <th className="py-3 px-5">Assigned Specialist</th>
                  <th className="py-3 px-5">Today&apos;s Progress</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Last Submission</th>
                  <th className="py-3 px-5">Latest Proof</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DC]">
                {cxWorkspaceList
                  .filter((cx) => {
                    if (cxStatusFilter !== "ALL" && cx.status !== cxStatusFilter) return false;
                    if (cxStaffFilter !== "ALL" && cx.staffId !== cxStaffFilter) return false;
                    if (
                      cxSearch.trim() &&
                      !cx.name.toLowerCase().includes(cxSearch.toLowerCase()) &&
                      !cx.targetRole.toLowerCase().includes(cxSearch.toLowerCase())
                    )
                      return false;
                    return true;
                  })
                  .map((cx) => (
                    <tr key={cx.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => setSelectedClientId(cx.id)}
                          className="text-left group"
                        >
                          <span className="font-bold text-[#182232] group-hover:text-[#E86328] transition-colors block">
                            {cx.name}
                          </span>
                          <span className="text-[11px] text-[#717B8A]">
                            {cx.targetRole}
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                          <span className="w-2 h-2 rounded-full bg-[#E86328]" />
                          <span>{cx.staffName}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                            <span className="text-[#182232]">
                              {cx.appliedToday} / {cx.dailyTarget}
                            </span>
                            <span className="text-[#717B8A]">{cx.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cx.status === "TARGET_DONE"
                                  ? "bg-emerald-500"
                                  : cx.appliedToday > 0
                                  ? "bg-[#E86328]"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${cx.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {cx.status === "TARGET_DONE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={10} className="text-emerald-600" />
                            <span>Target Done</span>
                          </span>
                        ) : cx.status === "IN_PROGRESS" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <Clock size={10} className="text-orange-600" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Not Started</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-[11px] font-mono">
                        {cx.lastAppTime
                          ? new Date(cx.lastAppTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-3.5 px-5">
                        {cx.latestProofUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxImageUrl(cx.latestProofUrl!);
                              setLightboxTitle(`Latest Submission Proof — ${cx.name}`);
                            }}
                            className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#EAE5DC] hover:border-[#E86328] group transition-all shrink-0"
                            title="Click to view submission proof"
                          >
                            <img
                              src={cx.latestProofUrl}
                              alt="Proof thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 size={10} className="text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No proof yet</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedClientId(cx.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#E86328] hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          Reassign / Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                {cxWorkspaceList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No candidate records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Applications Feed with Proof URLs */}
        <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EAE5DC] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#182232]">
                Live Applications Feed (Verified Proof Stream)
              </h3>
              <p className="text-xs text-[#717B8A] mt-0.5">
                Real-time external job applications logged with verified image proof
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          <div className="divide-y divide-[#EAE5DC]">
            {recentApplicationsFeed.map((app) => (
              <div
                key={app.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Proof thumbnail with click to enlarge */}
                  {app.proofImageUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLightboxImageUrl(app.proofImageUrl!);
                        setLightboxTitle(`${app.jobTitle} @ ${app.companyName}`);
                      }}
                      className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#EAE5DC] hover:border-[#E86328] group transition-all shrink-0"
                      title="Click to enlarge proof"
                    >
                      <img
                        src={app.proofImageUrl}
                        alt="Proof thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 size={11} className="text-white" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon size={15} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#182232] truncate">
                        {app.jobTitle}
                      </span>
                      <span className="text-xs text-[#717B8A]">@ {app.companyName}</span>
                    </div>
                    <p className="text-[11px] text-[#717B8A] mt-0.5 truncate">
                      Candidate:{" "}
                      <span className="font-semibold text-slate-800">
                        {app.client?.name || "Client"}
                      </span>{" "}
                      • Specialist:{" "}
                      <span className="font-semibold text-[#E86328]">
                        {app.client?.staff?.name || "Specialist"}
                      </span>{" "}
                      • Portal:{" "}
                      <span className="font-mono text-slate-600">
                        {app.portal || "Direct"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {app.jobPostingUrl && (
                    <a
                      href={app.jobPostingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#E86328] hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Posting</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(app.applicationDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                    <span>Applied</span>
                  </span>
                </div>
              </div>
            ))}

            {recentApplicationsFeed.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent applications logged with proofs yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCREENSHOT PROOF LIGHTBOX MODAL */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">
                {lightboxTitle || "Screenshot Proof of Application"}
              </span>
              <button
                onClick={() => setLightboxImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={lightboxImageUrl}
                alt="Verified Application Proof"
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}

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
