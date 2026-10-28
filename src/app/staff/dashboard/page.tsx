"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Target,
  Send,
  TrendingUp,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Filter,
  Eye,
  X,
  AlertCircle,
  Building2,
  Award,
  SlidersHorizontal,
} from "lucide-react";

interface CandidateStat {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  targetRole: string;
  preferredLocation: string;
  experienceLevel: string;
  dailyTarget: number;
  todayAppliedCount: number;
  periodAppliedCount: number;
  totalLifetimeCount: number;
  progressPercent: number;
  statusChip: "NOT_STARTED" | "IN_PROGRESS" | "TARGET_DONE";
  assignedStaff?: { id: string; name: string; role: string } | null;
  lastAppliedJob?: {
    jobTitle: string;
    companyName: string;
    portal: string;
    status: string;
    applicationDate: string;
  } | null;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    companyName: string;
    portal?: string | null;
    status: string;
    proofImageUrl?: string | null;
    applicationDate: string;
  }>;
}

interface ApplicationAuditItem {
  id: string;
  clientId: string;
  clientName: string;
  clientTargetRole: string;
  staffName?: string;
  jobTitle: string;
  companyName: string;
  portal: string;
  status: string;
  applicationDate: string;
  proofImageUrl?: string | null;
  jobPostingUrl?: string | null;
  notes?: string | null;
}

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  clientsCount?: number;
}

interface DashboardMetrics {
  totalCandidates: number;
  totalDailyTargetSum: number;
  totalAppliedToday: number;
  totalAppliedPeriod: number;
  overallCompletionRate: number;
  completedTargetsCount: number;
  avgAppsPerCandidate: string;
  portalBreakdown: Array<{ portal: string; count: number; percent: number }>;
  statusBreakdown: Array<{ status: string; count: number; percent: number }>;
}

export default function StaffPerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [currentStaff, setCurrentStaff] = useState<StaffProfile | null>(null);
  const [allStaff, setAllStaff] = useState<StaffProfile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("today");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [candidates, setCandidates] = useState<CandidateStat[]>([]);
  const [applications, setApplications] = useState<ApplicationAuditItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [portalFilter, setPortalFilter] = useState<string>("ALL");

  // Lightbox Modal for Proof Screenshot
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);

  // Candidate Drill-Down Modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateStat | null>(null);

  // Fetch Dashboard Data
  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStaffId && selectedStaffId !== "all") {
        params.append("staffId", selectedStaffId);
      }
      if (dateRange) {
        params.append("dateRange", dateRange);
      }

      const res = await fetch(`/api/staff/performance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentStaff(data.currentStaff);
        setAllStaff(data.allStaff || []);
        if (!selectedStaffId && data.currentStaff?.id) {
          setSelectedStaffId(data.currentStaff.id);
        }
        setMetrics(data.metrics || null);
        setCandidates(data.candidates || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load staff performance data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId, dateRange]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Filtered Candidates based on search and status
  const filteredCandidates = useMemo(() => {
    return candidates.filter((cx) => {
      const matchesSearch =
        cx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cx.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cx.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || cx.statusChip === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchQuery, statusFilter]);

  // Filtered Applications for Audit Trail
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesPortal =
        portalFilter === "ALL" ||
        app.portal.toLowerCase() === portalFilter.toLowerCase();
      const matchesSearch =
        app.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPortal && matchesSearch;
    });
  }, [applications, portalFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 lg:p-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E86328] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Staff Performance Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E86328]/20 text-[#E86328] border border-[#E86328]/30">
                  Performance & Output
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze candidate application velocity, daily target fulfillment, and staff hunting productivity
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Staff selector, Date filter & Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Staff Switcher */}
          {allStaff.length > 0 && (
            <div className="flex items-center gap-2 bg-[#131926] px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <Users size={14} className="text-[#E86328]" />
              <span className="text-slate-400 font-medium">Staff:</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {allStaff.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#131926] text-white">
                    {s.name} ({s.clientsCount || 0} Cx)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter Tabs */}
          <div className="flex items-center bg-[#131926] p-1 rounded-xl border border-slate-800 text-xs font-medium">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "7 Days" },
              { id: "30days", label: "30 Days" },
              { id: "all", label: "All Time" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  dateRange === d.id
                    ? "bg-[#E86328] text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchPerformanceData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#131926] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            title="Refresh Performance Metrics"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#E86328]" : ""} />
            <span>Refresh</span>
          </button>

          {/* Jump to Staff Workspace */}
          <Link
            href="/staff/workspace"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E86328] to-orange-600 hover:from-orange-600 hover:to-[#E86328] text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Briefcase size={14} />
            <span>Open Staff Workspace</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* 2. Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Applications Logged */}
        <div className="bg-[#131926] p-5 rounded-2xl border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-[#E86328]/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E86328]/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Applications {dateRange === "today" ? "Today" : "in Period"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E86328]/10 text-[#E86328] flex items-center justify-center">
              <Send size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? (dateRange === "today" ? metrics.totalAppliedToday : metrics.totalAppliedPeriod) : 0}
            </span>
            <span className="text-xs text-slate-400">
              / {metrics?.totalDailyTargetSum || 0} target
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Overall Goal Pacing</span>
              <span className="font-semibold text-emerald-400">
                {metrics?.overallCompletionRate || 0}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E86328] to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics?.overallCompletionRate || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Assigned Candidates (Cx) */}
        <div className="bg-[#131926] p-5 rounded-2xl border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Active Candidates (Cx)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics?.totalCandidates || 0}
            </span>
            <span className="text-xs text-slate-400">candidates assigned</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-300 font-medium">
            <Sparkles size={13} className="text-blue-400" />
            <span>Dedicated daily quotas active</span>
          </div>
        </div>

        {/* Card 3: Targets Fulfilled */}
        <div className="bg-[#131926] p-5 rounded-2xl border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Quota Achieved
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Target size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {metrics?.completedTargetsCount || 0}
            </span>
            <span className="text-xs text-slate-400">
              / {metrics?.totalCandidates || 0} candidates met quota
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={13} />
            <span>
              {metrics?.totalCandidates
                ? Math.round(
                    ((metrics.completedTargetsCount || 0) / metrics.totalCandidates) * 100
                  )
                : 0}
              % fulfillment rate
            </span>
          </div>
        </div>

        {/* Card 4: Avg Output per Candidate */}
        <div className="bg-[#131926] p-5 rounded-2xl border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Avg Pace / Candidate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics?.avgAppsPerCandidate || "0.0"}
            </span>
            <span className="text-xs text-slate-400">apps / candidate</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-300 font-medium">
            <Award size={13} className="text-purple-400" />
            <span>High hunting velocity</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Performance Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Candidate Target Progress Breakdown */}
        <div className="lg:col-span-2 bg-[#131926] p-6 rounded-2xl border border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Target size={18} className="text-[#E86328]" />
                <span>Candidate Quota Progress Pacing</span>
              </h2>
              <p className="text-xs text-slate-400">
                Live output vs assigned daily targets for each candidate (Cx)
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
              {candidates.length} Candidates Tracked
            </span>
          </div>

          <div className="space-y-4">
            {candidates.map((cx) => {
              const isTargetDone = cx.statusChip === "TARGET_DONE";
              const isInProgress = cx.statusChip === "IN_PROGRESS";

              return (
                <div
                  key={cx.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-sm border border-slate-700/60">
                        {cx.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">
                            {cx.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isTargetDone
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : isInProgress
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {isTargetDone
                              ? "Target Reached"
                              : isInProgress
                              ? "In Progress"
                              : "Not Started"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{cx.targetRole}</span>
                      </div>
                    </div>

                    {/* Progress Counts */}
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-sm font-bold text-white">
                          <span className={isTargetDone ? "text-emerald-400 font-extrabold" : "text-[#E86328]"}>
                            {cx.todayAppliedCount}
                          </span>
                          <span className="text-slate-400 text-xs"> / {cx.dailyTarget} Apps</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {cx.progressPercent}% Daily Goal
                        </span>
                      </div>

                      {/* Quick workspace jump */}
                      <Link
                        href={`/staff/workspace?candidate=${encodeURIComponent(cx.id)}`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-[#E86328] text-slate-300 hover:text-white transition-colors"
                        title={`Apply jobs for ${cx.name}`}
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTargetDone
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : cx.progressPercent > 50
                          ? "bg-gradient-to-r from-[#E86328] to-amber-400"
                          : "bg-[#E86328]"
                      }`}
                      style={{ width: `${Math.min(100, cx.progressPercent)}%` }}
                    />
                  </div>

                  {/* Last applied info */}
                  {cx.lastAppliedJob && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 truncate">
                        <Building2 size={12} className="text-slate-500 shrink-0" />
                        <span>Latest:</span>
                        <span className="text-slate-300 font-medium truncate">
                          {cx.lastAppliedJob.companyName} — {cx.lastAppliedJob.jobTitle}
                        </span>
                      </span>
                      <span className="shrink-0 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {cx.lastAppliedJob.portal}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Portals & Pipeline Stats */}
        <div className="space-y-6">
          {/* Job Portal Distribution */}
          <div className="bg-[#131926] p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={17} className="text-[#E86328]" />
                <span>Job Portals Utilized</span>
              </h2>
              <p className="text-xs text-slate-400">
                Application distribution across hunting channels
              </p>
            </div>

            <div className="space-y-3">
              {metrics?.portalBreakdown && metrics.portalBreakdown.length > 0 ? (
                metrics.portalBreakdown.map((item) => (
                  <div key={item.portal} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-300">{item.portal}</span>
                      <span className="font-semibold text-white">
                        {item.count} <span className="text-slate-400">({item.percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-[#E86328] rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  No portal application records in this timeframe.
                </div>
              )}
            </div>
          </div>

          {/* Application Status Health */}
          <div className="bg-[#131926] p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={17} className="text-emerald-400" />
                <span>Application Outcomes</span>
              </h2>
              <p className="text-xs text-slate-400">Status breakdown of submitted applications</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {metrics?.statusBreakdown && metrics.statusBreakdown.length > 0 ? (
                metrics.statusBreakdown.map((s) => (
                  <div
                    key={s.status}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center"
                  >
                    <span className="text-lg font-bold text-white">{s.count}</span>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                      {s.status}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-4 text-center text-xs text-slate-500">
                  No status counts recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Candidate-by-Candidate Performance Matrix ("Staff applying cx names counts") */}
      <div className="bg-[#131926] rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
        {/* Matrix Header & Filters */}
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-[#E86328]" />
              <span>Candidate Output Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed tracking of staff job applications submitted for each client (Cx)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search candidate or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E86328]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-[#E86328] cursor-pointer"
            >
              <option value="ALL">All Quota Statuses</option>
              <option value="TARGET_DONE">Target Done</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_STARTED">Not Started</option>
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-6">Candidate (Cx Name)</th>
                <th className="py-3.5 px-4">Target Role & Location</th>
                <th className="py-3.5 px-4 text-center">Daily Quota</th>
                <th className="py-3.5 px-4 text-center">Applied Count</th>
                <th className="py-3.5 px-4">Pacing & Status</th>
                <th className="py-3.5 px-4">Latest Application</th>
                <th className="py-3.5 px-6 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.length > 0 ? (
                filteredCandidates.map((cx) => {
                  const isDone = cx.statusChip === "TARGET_DONE";
                  const inProg = cx.statusChip === "IN_PROGRESS";

                  return (
                    <tr
                      key={cx.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700">
                            {cx.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block text-sm">
                              {cx.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {cx.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Role */}
                      <td className="py-4 px-4">
                        <span className="text-white font-medium block">
                          {cx.targetRole}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {cx.preferredLocation} • {cx.experienceLevel}
                        </span>
                      </td>

                      {/* Daily Quota */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 font-bold text-white">
                          {cx.dailyTarget}
                        </span>
                      </td>

                      {/* Applied Count */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={`text-base font-extrabold ${
                              isDone
                                ? "text-emerald-400"
                                : inProg
                                ? "text-[#E86328]"
                                : "text-slate-400"
                            }`}
                          >
                            {cx.todayAppliedCount}
                          </span>
                          <span className="text-slate-500 text-xs">/ {cx.dailyTarget}</span>
                        </div>
                      </td>

                      {/* Pacing & Status */}
                      <td className="py-4 px-4 min-w-[140px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-semibold ${
                                isDone
                                  ? "text-emerald-400"
                                  : inProg
                                  ? "text-amber-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {isDone ? "Target Met" : `${cx.progressPercent}%`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDone
                                  ? "bg-emerald-400"
                                  : inProg
                                  ? "bg-[#E86328]"
                                  : "bg-slate-700"
                              }`}
                              style={{ width: `${Math.min(100, cx.progressPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Latest Application */}
                      <td className="py-4 px-4">
                        {cx.lastAppliedJob ? (
                          <div>
                            <span className="text-slate-200 font-medium block truncate max-w-[180px]">
                              {cx.lastAppliedJob.companyName}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate block max-w-[180px]">
                              {cx.lastAppliedJob.jobTitle}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No applications today</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCandidate(cx)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors text-xs"
                          >
                            View Logs
                          </button>
                          <Link
                            href={`/staff/workspace?candidate=${encodeURIComponent(cx.id)}`}
                            className="px-3 py-1.5 rounded-lg bg-[#E86328] hover:bg-orange-600 text-white font-semibold transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                          >
                            <span>Apply</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No candidates matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Live Application Activity Stream / Audit Trail */}
      <div className="bg-[#131926] rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send size={18} className="text-[#E86328]" />
              <span>Application Submissions Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Full log of candidate applications submitted with screenshot proofs
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by Portal */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter size={13} />
              <span>Portal:</span>
              <select
                value={portalFilter}
                onChange={(e) => setPortalFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-[#E86328]"
              >
                <option value="ALL">All Portals</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Naukri">Naukri</option>
              </select>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
              {filteredApplications.length} Submissions
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[440px] overflow-y-auto">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Left: Candidate, Company, Role */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#E86328] font-bold flex items-center justify-center shrink-0 border border-orange-500/20">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">
                        {app.companyName}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300 font-medium">{app.jobTitle}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {app.portal}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="text-slate-300 font-medium">
                        Cx: {app.clientName}
                      </span>
                      <span>•</span>
                      <span>
                        Applied {new Date(app.applicationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {app.staffName && (
                        <>
                          <span>•</span>
                          <span>By {app.staffName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status badge & Proof Preview */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      app.status === "INTERVIEW"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : app.status === "REVIEWING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {app.status}
                  </span>

                  {app.proofImageUrl ? (
                    <button
                      onClick={() => {
                        setLightboxImage(app.proofImageUrl || null);
                        setLightboxTitle(
                          `${app.clientName} — ${app.companyName} (${app.jobTitle})`
                        );
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-[11px]"
                    >
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Proof</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic">No proof</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No application submissions logged in this period.
            </div>
          )}
        </div>
      </div>

      {/* 6. Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#131926] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E86328] text-white flex items-center justify-center font-bold text-lg">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCandidate.targetRole} • Daily Quota: {selectedCandidate.dailyTarget} Apps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Quick stats banner */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Applied Today</span>
                  <span className="text-xl font-bold text-[#E86328]">
                    {selectedCandidate.todayAppliedCount}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Daily Target</span>
                  <span className="text-xl font-bold text-white">
                    {selectedCandidate.dailyTarget}
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">Quota Completion</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {selectedCandidate.progressPercent}%
                  </span>
                </div>
              </div>

              {/* Recent Applications for this Candidate */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Recent Submissions ({selectedCandidate.recentApplications.length})
                </h4>
                <div className="space-y-2">
                  {selectedCandidate.recentApplications.length > 0 ? (
                    selectedCandidate.recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {app.companyName} — {app.jobTitle}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {app.portal || "Direct"} •{" "}
                            {new Date(app.applicationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {app.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No applications logged yet today.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ready to submit more applications for {selectedCandidate.name}?
              </span>
              <Link
                href={`/staff/workspace?candidate=${encodeURIComponent(selectedCandidate.id)}`}
                className="px-4 py-2 rounded-xl bg-[#E86328] hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Open Workspace</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 7. Screenshot Proof Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#131926] border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span className="font-semibold text-white text-sm">
                  Verified Application Screenshot Proof
                </span>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage}
                alt="Application Proof"
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
              />
              {lightboxTitle && (
                <span className="text-xs text-slate-400 mt-3 text-center">
                  {lightboxTitle}
                </span>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
