"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Target,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Maximize2,
  Calendar,
  BarChart3,
} from "lucide-react";

interface ApplicationItem {
  id: string;
  jobTitle: string;
  companyName: string;
  jobPostingUrl?: string | null;
  portal?: string | null;
  status: string;
  proofImageUrl?: string | null;
  applicationDate: string;
  notes?: string | null;
}

interface CandidateItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  targetRole: string;
  preferredLocation: string;
  experienceLevel: string;
  dailyTarget: number;
  appliedToday: number;
  progressPercent: number;
  statusChip: "NOT_STARTED" | "IN_PROGRESS" | "TARGET_DONE";
  todayApplications: ApplicationItem[];
}

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface WorkspaceMetrics {
  totalCandidates: number;
  totalTargetSum: number;
  totalAppliedToday: number;
  completedTargetsCount: number;
  overallCompletionRate: number;
}

export default function StaffWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [allStaff, setAllStaff] = useState<StaffProfile[]>([]);
  const [metrics, setMetrics] = useState<WorkspaceMetrics | null>(null);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Work Screen / Log Modal state
  const [activeCandidate, setActiveCandidate] = useState<CandidateItem | null>(null);
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"log" | "history">("log");

  // Log Application Form State
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobPostingUrl, setJobPostingUrl] = useState("");
  const [portal, setPortal] = useState("LinkedIn");
  const [notes, setNotes] = useState("");
  const [proofImageBase64, setProofImageBase64] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);

  // Form feedback
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [targetToast, setTargetToast] = useState<string | null>(null);

  // Lightbox Modal State
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);

  // History Tab Filter State
  const [historyFilter, setHistoryFilter] = useState<string>("today");
  const [customHistoryDate, setCustomHistoryDate] = useState<string>("");
  const [historyApplications, setHistoryApplications] = useState<ApplicationItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistoryApps = useCallback(async (cxId: string, filter: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/staff/applications?clientId=${encodeURIComponent(cxId)}&date=${encodeURIComponent(filter)}`
      );
      const data = await res.json();
      if (res.ok) {
        setHistoryApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to fetch application history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load workspace data
  const loadWorkspace = useCallback(async (staffId?: string) => {
    setLoading(true);
    try {
      const url = staffId
        ? `/api/staff/workspace?staffId=${encodeURIComponent(staffId)}`
        : "/api/staff/workspace";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setStaff(data.staff);
        setAllStaff(data.allStaff || []);
        setMetrics(data.metrics || null);
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to load staff workspace:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Open work screen for a specific candidate
  const handleOpenWorkScreen = (cx: CandidateItem) => {
    setActiveCandidate(cx);
    setJobTitle(cx.targetRole);
    setCompanyName("");
    setJobPostingUrl("");
    setPortal("LinkedIn");
    setNotes("");
    setProofImageBase64(null);
    setProofFileName(null);
    setFormError(null);
    setDuplicateWarning(null);
    setActiveTab("log");
    setHistoryFilter("today");
    setCustomHistoryDate("");
    setHistoryApplications(cx.todayApplications || []);
    setWorkModalOpen(true);
  };

  // Image Upload Handler with 5MB validation
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Only image files (PNG, JPG, JPEG, WebP) are accepted as proof.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("Screenshot proof must be under 5 MB in size.");
      return;
    }

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Application
  const handleSubmitApplication = async (allowDuplicate = false) => {
    if (!activeCandidate) return;

    // Validate inputs
    if (!jobTitle.trim() || !companyName.trim()) {
      setFormError("Job Role and Company Name are required.");
      return;
    }

    if (!proofImageBase64) {
      setFormError("Mandatory screenshot proof is required. Please upload screenshot of application.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    if (!allowDuplicate) {
      setDuplicateWarning(null);
    }

    try {
      const res = await fetch("/api/staff/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeCandidate.id,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          jobPostingUrl: jobPostingUrl.trim(),
          portal,
          notes: notes.trim(),
          proofImageUrl: proofImageBase64,
          allowDuplicate,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.isDuplicate) {
        setDuplicateWarning(data.error);
        return;
      }

      if (!res.ok) {
        setFormError(data.error || "Failed to log application.");
        return;
      }

      // Success: Celebration toast if target met!
      if (data.targetJustMet) {
        setTargetToast(`🎉 Target Achieved! ${data.appliedToday}/${data.dailyTarget} applications completed for ${activeCandidate.name} today!`);
        setTimeout(() => setTargetToast(null), 6000);
      }

      // Reset form
      setCompanyName("");
      setJobPostingUrl("");
      setNotes("");
      setProofImageBase64(null);
      setProofFileName(null);
      setDuplicateWarning(null);

      // Refresh workspace data
      await loadWorkspace(staff?.id);

      // Update active candidate state
      if (activeCandidate) {
        const updatedCx = {
          ...activeCandidate,
          appliedToday: data.appliedToday,
          progressPercent: Math.min(100, Math.round((data.appliedToday / data.dailyTarget) * 100)),
          statusChip: data.targetReached ? ("TARGET_DONE" as const) : ("IN_PROGRESS" as const),
          todayApplications: [data.application, ...activeCandidate.todayApplications],
        };
        setActiveCandidate(updatedCx);
      }
    } catch {
      setFormError("Unable to connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-[#E86328]/30 selection:text-[#E86328]">
      {/* Toast Notification for Target Met */}
      {targetToast && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-950 border border-emerald-500 text-emerald-200 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles size={20} className="text-[#34D399] shrink-0 animate-bounce" />
          <span className="text-xs sm:text-sm font-bold">{targetToast}</span>
          <button
            onClick={() => setTargetToast(null)}
            className="p-1 hover:bg-emerald-900 rounded-lg text-emerald-400"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="w-full bg-[#0E1420] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E86328] text-white flex items-center justify-center font-bold text-base shadow-md shadow-orange-950/50">
            J
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                JobAssist Staff Workspace
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded-full bg-orange-950/60 text-[#E86328] border border-orange-800/80">
                Staff Operations
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Apply on external job portals and record proof of submission
            </p>
          </div>
        </div>

        {/* Staff Switcher & Quick Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131B29] border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Active Specialist:</span>
            <select
              value={staff?.id || ""}
              onChange={(e) => loadWorkspace(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {allStaff.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0E1420] text-white">
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/staff/dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors hidden sm:inline-flex"
          >
            <BarChart3 size={13} className="text-[#E86328]" />
            <span>Staff Dashboard</span>
          </Link>

          <button
            onClick={() => loadWorkspace(staff?.id)}
            title="Refresh pipeline"
            className="p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* KPI Summary Banner */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Assigned Candidates (CX)
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-white">
                  {metrics.totalCandidates}
                </span>
                <Users size={18} className="text-slate-500" />
              </div>
            </div>

            <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Today's Total Target
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-white">
                  {metrics.totalTargetSum}
                </span>
                <Target size={18} className="text-[#E86328]" />
              </div>
            </div>

            <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Submitted Today
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-white">
                  {metrics.totalAppliedToday}
                </span>
                <Clock size={18} className="text-blue-400" />
              </div>
            </div>

            <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Targets Met Today
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-400">
                  {metrics.completedTargetsCount} / {metrics.totalCandidates}
                </span>
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        {/* Candidate Roster Section */}
        <div className="bg-[#0E1420] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-[#E86328]" />
                <span>My Customers (Assigned Candidates)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Apply on external job portals for these candidates and upload proof screenshots daily.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or role..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
              />
            </div>
          </div>

          {/* Candidates Table */}
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              Loading staff candidate pipeline...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <p>No candidates assigned to {staff?.name}.</p>
              <p className="text-[11px] text-slate-500">
                Admins can assign candidates via the Admin Dashboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Candidate</th>
                    <th className="py-3 px-3">Target Role</th>
                    <th className="py-3 px-3">Daily Target</th>
                    <th className="py-3 px-3">Today's Progress</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredCandidates.map((cx) => (
                    <tr
                      key={cx.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">{cx.name}</div>
                        <div className="text-[11px] text-slate-400">{cx.email}</div>
                      </td>

                      {/* Target Role & Location */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-200 font-medium">{cx.targetRole}</div>
                        <div className="text-[10px] text-slate-500">
                          {cx.preferredLocation} • {cx.experienceLevel}
                        </div>
                      </td>

                      {/* Daily Target */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className="font-bold text-white">{cx.dailyTarget}</span>{" "}
                        <span className="text-slate-500 text-[10px]">jobs/day</span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 px-3 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-white font-bold">
                            {cx.appliedToday} / {cx.dailyTarget}
                          </span>
                          <span
                            className={
                              cx.statusChip === "TARGET_DONE"
                                ? "text-emerald-400 font-bold"
                                : "text-slate-400"
                            }
                          >
                            {cx.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#0B0F17] rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              cx.statusChip === "TARGET_DONE"
                                ? "bg-emerald-500"
                                : "bg-[#E86328]"
                            }`}
                            style={{ width: `${cx.progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Status Chip */}
                      <td className="py-3.5 px-3">
                        {cx.statusChip === "TARGET_DONE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            <span>Target Done</span>
                          </span>
                        ) : cx.statusChip === "IN_PROGRESS" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-950/60 text-[#E86328] border border-orange-800/80">
                            <Clock size={11} />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                            <span>Not Started</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenWorkScreen(cx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white font-bold text-xs transition-all shadow-md shadow-orange-950/40"
                        >
                          <span>Log Applications</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* WORK SCREEN DRAWER / MODAL FOR SELECTED CANDIDATE         */}
      {/* ======================================================== */}
      {workModalOpen && activeCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1420] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E86328] text-white flex items-center justify-center font-bold text-base shadow-md">
                  {activeCandidate.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      {activeCandidate.name}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {activeCandidate.targetRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: <strong className="text-white">{activeCandidate.dailyTarget}</strong> jobs/day • Today: <strong className="text-[#E86328]">{activeCandidate.appliedToday}</strong> applied
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeCandidate.statusChip === "TARGET_DONE" && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Target Completed Today!</span>
                  </span>
                )}
                <button
                  onClick={() => setWorkModalOpen(false)}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher */}
            <div className="px-5 pt-3 bg-[#0B0F17] border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("log")}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "log"
                    ? "border-[#E86328] text-white font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Plus size={14} className={activeTab === "log" ? "text-[#E86328]" : ""} />
                <span>Log New Application</span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "history"
                    ? "border-[#E86328] text-white font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock size={14} className={activeTab === "history" ? "text-[#E86328]" : ""} />
                <span>Today's Applications ({activeCandidate.todayApplications.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* TAB 1: LOG APPLICATION FORM */}
              {activeTab === "log" && (
                <div className="space-y-4">
                  {/* Duplicate warning alert */}
                  {duplicateWarning && (
                    <div className="p-3 bg-amber-950/60 border border-amber-600/80 rounded-xl text-amber-200 text-xs flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Duplicate Warning</p>
                          <p className="mt-0.5 text-slate-300">{duplicateWarning}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubmitApplication(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shrink-0"
                      >
                        Submit Anyway
                      </button>
                    </div>
                  )}

                  {/* Form Error */}
                  {formError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <X size={14} className="text-rose-400 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Job Role */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Job Role / Title *
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Frontend Engineer"
                        required
                        className="w-full px-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Google, Flipkart, Stripe"
                        required
                        className="w-full px-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Portal / Job Source */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Portal / Application Source
                      </label>
                      <select
                        value={portal}
                        onChange={(e) => setPortal(e.target.value)}
                        className="w-full px-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E86328] cursor-pointer"
                      >
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Naukri">Naukri</option>
                        <option value="Indeed">Indeed</option>
                        <option value="Company Careers Page">Company Careers Page</option>
                        <option value="Wellfound / AngelList">Wellfound / AngelList</option>
                        <option value="Direct Outreach">Direct Email / Recruiter Outreach</option>
                      </select>
                    </div>

                    {/* Job Posting URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Job Posting Link (URL)
                      </label>
                      <input
                        type="url"
                        value={jobPostingUrl}
                        onChange={(e) => setJobPostingUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                      />
                    </div>
                  </div>

                  {/* MANDATORY SCREENSHOT PROOF UPLOAD */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Proof of Submission (Screenshot Upload) *
                      <span className="text-[10px] font-normal text-slate-500 ml-1.5">
                        Required • Images only • Max 5 MB
                      </span>
                    </label>

                    {!proofImageBase64 ? (
                      <label className="border-2 border-dashed border-slate-800 hover:border-[#E86328]/60 bg-[#080C14] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                        <UploadCloud
                          size={24}
                          className="text-slate-500 group-hover:text-[#E86328] mb-2 transition-colors"
                        />
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                          Click to upload screenshot proof
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Upload confirmation screen, thank-you page, or application receipt
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="bg-[#080C14] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                            <img
                              src={proofImageBase64}
                              alt="Proof preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Check size={13} className="text-emerald-400" />
                              <span>Screenshot Proof Attached</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate max-w-xs">
                              {proofFileName || "proof_screenshot.png"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxImageUrl(proofImageBase64);
                              setLightboxTitle(`Proof Preview: ${companyName || "Application"}`);
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300"
                            title="Preview image"
                          >
                            <Maximize2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProofImageBase64(null);
                              setProofFileName(null);
                            }}
                            className="p-1.5 rounded-lg border border-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400"
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Internal Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Applied via referral / customized resume version 3 used"
                      className="w-full px-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitApplication(false)}
                      className="w-full py-3 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-950/50 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Recording Application & Verifying Proof...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Verified Job Application</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICATIONS LIST & DATE FILTER WITH LIGHTBOX PROOFS */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  {/* Date Filter Bar */}
                  <div className="p-3 bg-[#080C14] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400">Filter Date:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryFilter("today");
                          setCustomHistoryDate("");
                          setHistoryApplications(activeCandidate.todayApplications || []);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          historyFilter === "today"
                            ? "bg-[#E86328] text-white"
                            : "bg-[#131B29] text-slate-300 hover:text-white border border-slate-800"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryFilter("all");
                          setCustomHistoryDate("");
                          fetchHistoryApps(activeCandidate.id, "all");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          historyFilter === "all"
                            ? "bg-[#E86328] text-white"
                            : "bg-[#131B29] text-slate-300 hover:text-white border border-slate-800"
                        }`}
                      >
                        All History
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-500" />
                      <input
                        type="date"
                        value={customHistoryDate}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          setCustomHistoryDate(dateVal);
                          if (dateVal) {
                            setHistoryFilter(dateVal);
                            fetchHistoryApps(activeCandidate.id, dateVal);
                          }
                        }}
                        className="px-2.5 py-1 bg-[#131B29] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                      />
                    </div>
                  </div>

                  {loadingHistory ? (
                    <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-[#E86328]" />
                      <span>Loading applications history...</span>
                    </div>
                  ) : (historyFilter === "today" ? activeCandidate.todayApplications : historyApplications).length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                      <p>No applications logged for this candidate {historyFilter === "today" ? "today" : "matching this date"}.</p>
                      <button
                        onClick={() => setActiveTab("log")}
                        className="text-[#E86328] hover:underline font-bold text-xs"
                      >
                        + Log an application
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {(historyFilter === "today" ? activeCandidate.todayApplications : historyApplications).map((app) => (
                        <div
                          key={app.id}
                          className="py-3 flex items-center justify-between gap-3 group"
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
                                className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 shrink-0 group-hover:border-[#E86328] transition-colors"
                                title="Click to enlarge proof"
                              >
                                <img
                                  src={app.proofImageUrl}
                                  alt="Proof thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Maximize2 size={12} className="text-white" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                                <ImageIcon size={16} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-white truncate">
                                {app.jobTitle}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {app.companyName} • <span className="font-mono">{app.portal || "Direct"}</span>
                              </p>
                              {app.jobPostingUrl && (
                                <a
                                  href={app.jobPostingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[#E86328] hover:underline inline-flex items-center gap-1 mt-0.5"
                                >
                                  <span>Job Link</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 size={10} className="text-emerald-400" />
                              <span>Applied</span>
                            </span>
                            <span className="block text-[10px] text-slate-500 font-mono mt-1">
                              {new Date(app.applicationDate).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                              {new Date(app.applicationDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREENSHOT PROOF LIGHTBOX MODAL                           */}
      {/* ======================================================== */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="bg-[#0E1420] border border-slate-800 rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white">
                {lightboxTitle || "Screenshot Proof of Application"}
              </span>
              <button
                onClick={() => setLightboxImageUrl(null)}
                className="p-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-black/60">
              <img
                src={lightboxImageUrl}
                alt="Enlarged proof"
                className="max-h-[75vh] w-auto rounded-lg shadow-xl object-contain border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
