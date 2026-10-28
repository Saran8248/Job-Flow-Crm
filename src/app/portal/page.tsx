"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Target,
  FileCheck2,
  CalendarCheck2,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  Building,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SummaryResponse {
  candidate: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    targetRole: string;
    preferredLocation?: string;
    experienceLevel?: string;
    currentStage: string;
    dailyTarget: number;
  };
  specialist: {
    name: string;
    role: string;
    email: string;
  } | null;
  counters: {
    totalApplied: number;
    appliedToday: number;
    dailyTarget: number;
    targetCompletedToday?: boolean;
    assessments: number;
    interviews: number;
    offers: number;
  };
  funnel: {
    applied: number;
    replied: number;
    assessment: number;
    interview: number;
    offer: number;
  };
  stagesTracker: Array<{
    key: string;
    label: string;
    isCompleted: boolean;
    isCurrent: boolean;
    reachedDate: string | null;
    clientNote: string | null;
  }>;
  upcomingInterviews: Array<{
    id: string;
    companyName: string;
    round: string;
    scheduledAt: string;
    status: string;
    meetingLink?: string;
  }>;
  recentApplications: Array<{
    id: string;
    companyName: string;
    jobTitle: string;
    portal?: string;
    status: string;
    proofImageUrl?: string | null;
    applicationDate: string;
    jobPostingUrl?: string;
  }>;
  plan: {
    planDurationMonths: number;
    planStartDate: string;
    planEndDate: string;
    daysRemaining: number;
    totalFee: number;
    amountPaid: number;
    balance: number;
  };
  lastUpdated: string;
}

export default function CandidateDashboard() {
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const [sumRes, timeRes] = await Promise.all([
        fetch("/api/portal/summary"),
        fetch("/api/portal/timeline"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setData(sumData);
      }

      if (timeRes.ok) {
        const timeData = await timeRes.json();
        setTimeline(timeData.events || []);
      }
    } catch (err) {
      console.error("Failed to load candidate portal dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#E86328] rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading your candidate cockpit...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-bold text-slate-800">Unable to load dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">Please try refreshing or contact your specialist.</p>
        <button
          onClick={() => loadPortalData()}
          className="mt-4 px-4 py-2 bg-[#E86328] text-white text-xs font-semibold rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const todayPercent = Math.min(
    100,
    Math.round((data.counters.appliedToday / (data.counters.dailyTarget || 60)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* 1. Candidate Hero Header */}
      <div className="bg-gradient-to-r from-[#182232] to-[#253248] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-[11px] font-semibold mb-2">
            <Sparkles size={13} />
            <span>Target Role: {data.candidate.targetRole}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {data.candidate.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Here is your live job search progress. Your specialist is submitting targeted applications
            daily and coordinating recruiter feedback directly to your cockpit.
          </p>
        </div>

        {/* Assigned Specialist Pill */}
        {data.specialist && (
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3.5 shrink-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E86328] text-white flex items-center justify-center font-bold text-sm">
              {data.specialist.name.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">
                Assigned Specialist
              </div>
              <div className="text-xs font-bold text-white">{data.specialist.name}</div>
              <div className="text-[11px] text-orange-200">{data.specialist.role}</div>
            </div>
          </div>
        )}
      </div>

      {/* Target Completed Celebration Banner */}
      {(data.counters.appliedToday >= data.counters.dailyTarget || data.counters.targetCompletedToday) && (
        <div className="bg-gradient-to-r from-[#0E1420] via-[#131B29] to-[#1A120B] border border-emerald-500/50 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">
                  Today&apos;s Application Target Completed!
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Target Met
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Your Career Specialist has successfully filed {data.counters.appliedToday} out of {data.counters.dailyTarget} targeted applications today. All submission proofs are logged below.
              </p>
            </div>
          </div>
          <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10 shrink-0">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {data.counters.appliedToday} / {data.counters.dailyTarget}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">100% Target Met Today</span>
          </div>
        </div>
      )}

      {/* 2. Requirement F1: 9-Stage Progress Tracker Stepper */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-[#E86328]" />
              <span>Job Search Pipeline Progress</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Current Milestone:{" "}
              <span className="font-semibold text-[#E86328]">
                {data.candidate.currentStage.replace(/_/g, " ")}
              </span>
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            9 structured steps to career placement
          </div>
        </div>

        {/* Horizontal scrollable stepper (Mobile first with smooth snap) */}
        <div className="overflow-x-auto pb-3 pt-1">
          <div className="grid grid-flow-col auto-cols-[145px] sm:auto-cols-[165px] gap-2 min-w-[1300px]">
            {data.stagesTracker.map((st, idx) => (
              <div
                key={st.key}
                className={`relative rounded-xl p-3 border transition-all flex flex-col justify-between min-h-[105px] ${
                  st.isCurrent
                    ? "bg-orange-50/80 border-[#E86328] ring-2 ring-[#E86328]/20 shadow-xs"
                    : st.isCompleted
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-white border-dashed border-slate-200 text-slate-400 opacity-70"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        st.isCurrent
                          ? "bg-[#E86328] text-white"
                          : st.isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {st.isCompleted && (
                      <CheckCircle2
                        size={14}
                        className={st.isCurrent ? "text-[#E86328]" : "text-emerald-600"}
                      />
                    )}
                  </div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      st.isCurrent ? "text-[#E86328]" : "text-slate-800"
                    }`}
                  >
                    {st.label}
                  </h4>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-100 text-[10px]">
                  {st.reachedDate ? (
                    <span className="text-slate-500">
                      Reached {new Date(st.reachedDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Requirement F2: Headline Counters (5 Key Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Applied */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Applied</span>
            <Send size={15} className="text-[#E86328]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {data.counters.totalApplied}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            Submitted via JobAssist
          </span>
        </div>

        {/* Applied Today vs Daily Target */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Today&apos;s Target</span>
            <Target size={15} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {data.counters.appliedToday}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              / {data.counters.dailyTarget}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${todayPercent}%` }}
            />
          </div>
        </div>

        {/* Assessments */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Assessments</span>
            <FileCheck2 size={15} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {data.counters.assessments}
          </div>
          <span className="text-[10px] text-purple-600 font-medium mt-0.5 block truncate">
            Technical Tests
          </span>
        </div>

        {/* Interviews */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Interviews</span>
            <CalendarCheck2 size={15} className="text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {data.counters.interviews}
          </div>
          <span className="text-[10px] text-teal-600 font-medium mt-0.5 block truncate">
            Rounds Secured
          </span>
        </div>

        {/* Offers */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Job Offers</span>
            <Trophy size={15} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {data.counters.offers}
          </div>
          <span className="text-[10px] text-amber-600 font-medium mt-0.5 block truncate">
            Final Conversions
          </span>
        </div>
      </div>

      {/* 4. Requirement F3: Funnel Visualization & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* F3: Funnel Card (approx 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Application Conversion Funnel
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Conversion rates from initial dispatch to offer
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Live Funnel
            </span>
          </div>

          {/* Funnel horizontal flow */}
          <div className="space-y-3 pt-2">
            {[
              {
                label: "Applications Sent",
                count: data.funnel.applied,
                color: "bg-[#E86328]",
                pct: 100,
              },
              {
                label: "Recruiter Responses",
                count: data.funnel.replied,
                color: "bg-blue-500",
                pct: data.funnel.applied > 0 ? Math.round((data.funnel.replied / data.funnel.applied) * 100) : 0,
              },
              {
                label: "Assessments Received",
                count: data.funnel.assessment,
                color: "bg-purple-500",
                pct: data.funnel.applied > 0 ? Math.round((data.funnel.assessment / data.funnel.applied) * 100) : 0,
              },
              {
                label: "Interviews Secured",
                count: data.funnel.interview,
                color: "bg-teal-500",
                pct: data.funnel.applied > 0 ? Math.round((data.funnel.interview / data.funnel.applied) * 100) : 0,
              },
              {
                label: "Offers Made",
                count: data.funnel.offer,
                color: "bg-amber-500",
                pct: data.funnel.applied > 0 ? Math.round((data.funnel.offer / data.funnel.applied) * 100) : 0,
              },
            ].map((step) => (
              <div key={step.label} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-5 sm:col-span-4 text-xs font-semibold text-slate-700 truncate">
                  {step.label}
                </div>
                <div className="col-span-5 sm:col-span-6">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${step.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(4, step.pct)}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-2 text-right text-xs font-bold text-slate-900">
                  {step.count}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Daily submissions increase recruiter reply velocity.</span>
            <Link
              href="/portal/applications"
              className="text-[#E86328] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>View all applications</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Upcoming Interviews Preview (approx 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Upcoming Interviews
              </h3>
              <Link
                href="/portal/interviews"
                className="text-[11px] text-[#E86328] font-semibold hover:underline"
              >
                View all ({data.counters.interviews})
              </Link>
            </div>

            <div className="space-y-3">
              {data.upcomingInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-[#E86328]/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {iv.companyName}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      {iv.round}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} />
                      {new Date(iv.scheduledAt).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {iv.meetingLink && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#E86328] px-2.5 py-1 rounded-md hover:bg-[#D2541C] transition-colors"
                      >
                        <Video size={11} />
                        <span>Join</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {data.upcomingInterviews.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No upcoming interviews scheduled today. Your specialist will notify you as soon as slots open!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Interview links are verified by your specialist.</span>
          </div>
        </div>
      </div>

      {/* 4.5 Verified Applications with Submission Proofs */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#E86328]" />
              <span>Verified Applications Dispatched on Your Behalf</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Every submission logged by your specialist includes screenshot proof of application.
            </p>
          </div>
          <Link
            href="/portal/applications"
            className="text-xs font-bold text-[#E86328] hover:underline inline-flex items-center gap-1"
          >
            <span>View All ({data.counters.totalApplied})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {data.recentApplications && data.recentApplications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Proof Thumbnail</th>
                  <th className="py-2.5 px-3">Job Role</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Portal</th>
                  <th className="py-2.5 px-3">Applied Date & Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Job Posting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      {app.proofImageUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxImageUrl(app.proofImageUrl!);
                            setLightboxTitle(`${app.jobTitle} @ ${app.companyName}`);
                          }}
                          className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 hover:border-[#E86328] group transition-all shrink-0"
                          title="Click to view full screenshot proof"
                        >
                          <img
                            src={app.proofImageUrl}
                            alt="Application proof"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 size={12} className="text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          <ImageIcon size={15} />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-[180px] truncate">
                      {app.jobTitle}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 max-w-[150px] truncate">
                      <div className="flex items-center gap-1.5">
                        <Building size={13} className="text-slate-400 shrink-0" />
                        <span>{app.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {app.portal || "Direct"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                      {formatDate(app.applicationDate)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} className="text-emerald-600" />
                        <span>{app.status || "Applied"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {app.jobPostingUrl ? (
                        <a
                          href={app.jobPostingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#E86328] font-bold text-[11px] hover:underline"
                        >
                          <span>Link</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No applications logged yet today. Submissions will appear here in real-time as your specialist applies.
          </div>
        )}
      </div>

      {/* 5. Requirement F7: Activity Timeline & Requirement F8: Plan Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* F7: Candidate-Safe Activity Timeline (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Activity Timeline
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Milestones reached and verified updates
              </p>
            </div>
            <span className="text-[10px] text-slate-400">Candidate-safe events</span>
          </div>

          <div className="space-y-4 pt-1">
            {timeline.slice(0, 6).map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#E86328] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{event.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(event.timestamp).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}

            {timeline.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No timeline activity logged yet.
              </div>
            )}
          </div>
        </div>

        {/* F8: Plan Info & Service Card (4 cols) */}
        <div id="my-plan" className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Plan Details
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Active Service
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service Plan</span>
                <span className="font-bold text-slate-900">
                  {data.plan.planDurationMonths} {data.plan.planDurationMonths === 1 ? "Month" : "Months"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Validity</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(data.plan.planEndDate)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Days Remaining</span>
                <span className="font-bold text-[#E86328]">
                  {data.plan.daysRemaining} Days
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fee Settled</span>
                <span className="font-bold text-emerald-700">
                  ₹{data.plan.amountPaid.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Balance</span>
                <span className="font-semibold text-slate-700">
                  ₹{data.plan.balance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
            For plan extensions or interview coaching, connect with your specialist.
          </div>
        </div>
      </div>

      {/* SCREENSHOT PROOF LIGHTBOX MODAL */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">
                {lightboxTitle || "Screenshot Proof of Submission"}
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
                alt="Verified Proof"
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
