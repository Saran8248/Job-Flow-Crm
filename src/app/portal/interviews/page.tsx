"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck2,
  FileCheck2,
  Clock,
  Video,
  Calendar,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface InterviewRecord {
  id: string;
  companyName: string;
  round: string;
  scheduledAt: string;
  status: string;
  meetingLink?: string;
  application?: {
    id: string;
    jobTitle: string;
    jobLocation?: string;
    portal?: string;
  };
}

interface AssessmentRecord {
  id: string;
  companyName: string;
  jobTitle: string;
  jobPostingUrl?: string;
  portal?: string;
  applicationDate: string;
  lastStatusAt?: string;
}

export default function CandidateInterviewsPage() {
  const [upcoming, setUpcoming] = useState<InterviewRecord[]>([]);
  const [past, setPast] = useState<InterviewRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"interviews" | "assessments">("interviews");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portal/interviews");
      if (res.ok) {
        const data = await res.json();
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
        setAssessments(data.assessments || []);
      }
    } catch (err) {
      console.error("Failed to load candidate interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck2 size={22} className="text-[#E86328]" />
            <span>Interviews & Technical Assessments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access meeting rooms, preparation notes, and pending coding tests
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:text-slate-900 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-80 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("interviews")}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "interviews"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarCheck2 size={14} />
          <span>Interviews ({upcoming.length + past.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("assessments")}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "assessments"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCheck2 size={14} />
          <span>Assessments ({assessments.length})</span>
        </button>
      </div>

      {/* TAB 1: INTERVIEWS */}
      {activeTab === "interviews" && (
        <div className="space-y-8">
          {/* Upcoming Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Upcoming Scheduled Interviews</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {upcoming.length} rounds confirmed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((iv) => (
                <div
                  key={iv.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#E86328]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {iv.companyName}
                        </h3>
                        {iv.application?.jobTitle && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {iv.application.jobTitle}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                        {iv.round}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Calendar size={14} className="text-[#E86328]" />
                        <span>
                          {new Date(iv.scheduledAt).toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        <span>
                          {new Date(iv.scheduledAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} IST
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Slot Confirmed</span>
                    </span>

                    {iv.meetingLink ? (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Video size={13} />
                        <span>Join Call</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Link pending</span>
                    )}
                  </div>
                </div>
              ))}

              {upcoming.length === 0 && !loading && (
                <div className="col-span-full bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                  No upcoming interviews currently scheduled. Your specialist will notify you directly when interview rounds are secured.
                </div>
              )}
            </div>
          </div>

          {/* Past Interviews Section */}
          {past.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-700">
                Past Completed Interviews ({past.length})
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {past.map((iv) => (
                  <div key={iv.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{iv.companyName}</div>
                      <div className="text-[11px] text-slate-500">
                        {iv.round} · {iv.application?.jobTitle || "Direct Role"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-slate-700">
                        {new Date(iv.scheduledAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASSESSMENTS */}
      {activeTab === "assessments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 size={16} className="text-purple-600" />
                <span>Technical Evaluations & Online Tests</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Complete these promptly to advance to direct interview rounds
              </p>
            </div>
            <span className="text-xs text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
              {assessments.length} Active Tests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs hover:border-purple-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {test.companyName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      ASSESSMENT
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">
                    {test.jobTitle}
                  </p>

                  <div className="mt-3 p-3 bg-purple-50/60 rounded-xl text-[11px] text-purple-900 space-y-1">
                    <div className="flex items-center gap-1 font-semibold">
                      <Clock size={12} />
                      <span>Received via {test.portal || "Direct Portal"}</span>
                    </div>
                    <p className="text-[10px] text-purple-700">
                      Check your registered candidate email for the test platform link.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Received {new Date(test.applicationDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>

                  {test.jobPostingUrl && (
                    <a
                      href={test.jobPostingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E86328] hover:underline"
                    >
                      <span>Role Info</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {assessments.length === 0 && !loading && (
              <div className="col-span-full bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
                No pending assessments at this time.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
