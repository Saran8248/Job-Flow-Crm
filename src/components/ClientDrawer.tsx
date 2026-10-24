"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CreditCard,
  UserCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  Send,
  Building,
  FileText,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { STAGES, STAGE_LIST, StageKey, PAYMENT_STATUSES } from "@/lib/types";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface ClientDrawerProps {
  clientId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function ClientDrawer({ clientId, onClose, onUpdate }: ClientDrawerProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "applications" | "payments" | "interviews" | "communications" | "notes" | "history"
  >("overview");
  const [staffList, setStaffList] = useState<any[]>([]);

  // Action modals/inputs
  const [newStage, setNewStage] = useState<StageKey | "">("");
  const [stageNotes, setStageNotes] = useState("");
  const [changingStage, setChangingStage] = useState(false);

  // New Application inputs
  const [showAddApp, setShowAddApp] = useState(false);
  const [appCompany, setAppCompany] = useState("");
  const [appRole, setAppRole] = useState("");
  const [appLocation, setAppLocation] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [appStatus, setAppStatus] = useState("APPLIED");
  const [appNotes, setAppNotes] = useState("");

  // New Payment inputs
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(5000);
  const [payMethod, setPayMethod] = useState("UPI / Bank Transfer");
  const [payRef, setPayRef] = useState("");

  // New Interview inputs
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [interviewCompany, setInterviewCompany] = useState("");
  const [interviewRound, setInterviewRound] = useState("Round 1 - Technical");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLink, setInterviewLink] = useState("");

  // New Note input
  const [noteContent, setNoteContent] = useState("");

  // Notification / error feedback
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
      loadStaff();
      setActiveTab("overview");
      setMessage(null);
    }
  }, [clientId]);

  const loadClient = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setNewStage(data.client.currentStage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStageChange = async () => {
    if (!client || !newStage || newStage === client.currentStage) return;
    setChangingStage(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStage,
          notes: stageNotes || `Stage updated to ${STAGES[newStage as StageKey].label}`,
        }),
      });
      if (res.ok) {
        setMessage({ text: "Stage updated successfully!", type: "success" });
        setStageNotes("");
        await loadClient(client.id);
        onUpdate();
      }
    } catch (err) {
      setMessage({ text: "Failed to update stage", type: "error" });
    } finally {
      setChangingStage(false);
    }
  };

  const handleStaffReassign = async (staffId: string) => {
    if (!client) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedStaffId: staffId || null }),
      });
      if (res.ok) {
        setMessage({ text: "Staff assignment updated!", type: "success" });
        await loadClient(client.id);
        onUpdate();
      }
    } catch {
      setMessage({ text: "Failed to reassign staff", type: "error" });
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !appCompany || !appRole) return;
    try {
      const res = await fetch(`/api/clients/${client.id}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: appCompany,
          jobTitle: appRole,
          jobLocation: appLocation,
          jobPostingUrl: appUrl,
          status: appStatus,
          notes: appNotes,
        }),
      });
      if (res.ok) {
        setMessage({ text: "Application recorded successfully!", type: "success" });
        setShowAddApp(false);
        setAppCompany("");
        setAppRole("");
        setAppLocation("");
        setAppUrl("");
        setAppNotes("");
        await loadClient(client.id);
        onUpdate();
      }
    } catch {
      setMessage({ text: "Failed to record application", type: "error" });
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || payAmount <= 0) return;
    try {
      const res = await fetch(`/api/clients/${client.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
        }),
      });
      if (res.ok) {
        setMessage({ text: "Payment logged successfully!", type: "success" });
        setShowAddPayment(false);
        setPayRef("");
        await loadClient(client.id);
        onUpdate();
      }
    } catch {
      setMessage({ text: "Failed to log payment", type: "error" });
    }
  };

  const handleAddInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !interviewCompany || !interviewTime) return;
    try {
      const res = await fetch(`/api/clients/${client.id}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: interviewCompany,
          round: interviewRound,
          scheduledAt: interviewTime,
          meetingLink: interviewLink,
        }),
      });
      if (res.ok) {
        setMessage({ text: "Interview scheduled successfully!", type: "success" });
        setShowAddInterview(false);
        setInterviewCompany("");
        setInterviewLink("");
        await loadClient(client.id);
        onUpdate();
      }
    } catch {
      setMessage({ text: "Failed to schedule interview", type: "error" });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !noteContent.trim()) return;
    try {
      const res = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent.trim() }),
      });
      if (res.ok) {
        setNoteContent("");
        await loadClient(client.id);
      }
    } catch {
      setMessage({ text: "Failed to add note", type: "error" });
    }
  };

  if (!clientId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div
        className="relative w-full max-w-3xl bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#EAE5DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-white px-6 py-4 border-b border-[#EAE5DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E86328]/10 text-[#E86328] font-bold text-lg flex items-center justify-center">
              {client ? client.name.charAt(0) : "C"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#182232] leading-tight">
                {client ? client.name : "Loading client..."}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#717B8A]">
                <span>{client?.targetRole}</span>
                <span>•</span>
                <span>{client?.planDurationMonths} Month Plan</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                : "bg-red-50 text-red-800 border-b border-red-200"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white px-6 border-b border-[#EAE5DC] flex gap-6 text-xs font-medium overflow-x-auto">
          {[
            { key: "overview", label: "Overview" },
            { key: "applications", label: `Applications (${client?._count?.applications || 0})` },
            { key: "payments", label: `Payments (${client?.payments?.length || 0})` },
            { key: "interviews", label: `Interviews (${client?.interviews?.length || 0})` },
            { key: "communications", label: `Communications (${client?.recruiterCommunications?.length || 0})` },
            { key: "notes", label: `Notes (${client?.clientNotes?.length || 0})` },
            { key: "history", label: "History" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-[#E86328] text-[#E86328] font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && !client ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Loading client details...
            </div>
          ) : client ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Service Stage Quick-Bar */}
                  <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Current Stage:</span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            STAGES[client.currentStage as StageKey]?.pillBg || "bg-gray-100"
                          } ${
                            STAGES[client.currentStage as StageKey]?.pillText || "text-gray-800"
                          }`}
                        >
                          {STAGES[client.currentStage as StageKey]?.label || client.currentStage}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Ends: {formatDate(client.planEndDate)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
                      <select
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value as StageKey)}
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                      >
                        {STAGE_LIST.map((key) => (
                          <option key={key} value={key}>
                            Move to: {STAGES[key].label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleStageChange}
                        disabled={changingStage || newStage === client.currentStage}
                        className="px-4 py-2 text-xs font-medium bg-[#E86328] hover:bg-[#D2541C] text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {changingStage ? "Updating..." : "Update Stage"}
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-[#EAE5DC]">
                      <span className="text-[11px] text-slate-500 font-medium">Payment Status</span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            PAYMENT_STATUSES[client.paymentStatus as keyof typeof PAYMENT_STATUSES]?.dotColor ||
                            "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm font-semibold text-slate-800">
                          {PAYMENT_STATUSES[client.paymentStatus as keyof typeof PAYMENT_STATUSES]?.label ||
                            client.paymentStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Bal: {formatCurrency(client.balance)}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#EAE5DC]">
                      <span className="text-[11px] text-slate-500 font-medium">Applications</span>
                      <div className="mt-1 text-base font-bold text-slate-800">
                        {client.totalApplicationsCount || 0}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Target: {client.dailyTarget}/day
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#EAE5DC]">
                      <span className="text-[11px] text-slate-500 font-medium">Interviews</span>
                      <div className="mt-1 text-base font-bold text-slate-800">
                        {client.interviews?.length || 0}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">Secured</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-[#EAE5DC]">
                      <span className="text-[11px] text-slate-500 font-medium">Staff Assigned</span>
                      <div className="mt-1 text-sm font-semibold text-slate-800 truncate">
                        {client.staff?.name || "Unassigned"}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {client.staff?.role || "Support"}
                      </span>
                    </div>
                  </div>

                  {/* Client Details Section */}
                  <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Contact & Profile Info
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Email</span>
                        <a
                          href={`mailto:${client.email}`}
                          className="font-medium text-[#E86328] hover:underline"
                        >
                          {client.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Phone</span>
                        <span className="font-medium text-slate-700">{client.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Preferred Location</span>
                        <span className="font-medium text-slate-700">
                          {client.preferredLocation || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Experience Level</span>
                        <span className="font-medium text-slate-700">
                          {client.experienceLevel || "Not specified"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block mb-0.5">Core Skills</span>
                        <span className="font-medium text-slate-700">
                          {client.skills || "Not specified"}
                        </span>
                      </div>
                      {client.resumeUrl && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block mb-0.5">Resume</span>
                          <a
                            href={client.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-[#E86328] hover:underline"
                          >
                            <span>Open Resume Link</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Staff Reassignment Quick Control */}
                  <div className="bg-white rounded-xl p-5 border border-[#EAE5DC]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Reassign Staff Member
                    </h3>
                    <div className="flex gap-2">
                      <select
                        defaultValue={client.assignedStaffId || ""}
                        onChange={(e) => handleStaffReassign(e.target.value)}
                        className="text-xs px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E86328] flex-1"
                      >
                        <option value="">Unassigned</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} — {s.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: APPLICATIONS */}
              {activeTab === "applications" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Application Log ({client.applications?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowAddApp(!showAddApp)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#E86328] hover:bg-[#D2541C] text-white rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Log Application</span>
                    </button>
                  </div>

                  {showAddApp && (
                    <form
                      onSubmit={handleAddApplication}
                      className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-800">Record New Job Application</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Company name (e.g. Google)"
                          value={appCompany}
                          onChange={(e) => setAppCompany(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Job Title"
                          value={appRole}
                          onChange={(e) => setAppRole(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g. Bangalore / Remote)"
                          value={appLocation}
                          onChange={(e) => setAppLocation(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <input
                          type="url"
                          placeholder="Job Posting URL"
                          value={appUrl}
                          onChange={(e) => setAppUrl(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <select
                          value={appStatus}
                          onChange={(e) => setAppStatus(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="ASSESSMENT">Assessment</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="OFFER">Offer</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="WITHDRAWN">Withdrawn</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Notes"
                          value={appNotes}
                          onChange={(e) => setAppNotes(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddApp(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs bg-[#E86328] text-white rounded-lg hover:bg-[#D2541C]"
                        >
                          Save Application
                        </button>
                      </div>
                    </form>
                  )}

                  {client.applications && client.applications.length > 0 ? (
                    <div className="bg-white rounded-xl border border-[#EAE5DC] overflow-hidden divide-y divide-gray-100">
                      {client.applications.map((app: any) => (
                        <div key={app.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">{app.companyName}</div>
                            <div className="text-slate-500 mt-0.5">
                              {app.jobTitle} {app.jobLocation && `• ${app.jobLocation}`}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {formatDateTime(app.applicationDate)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                                app.status === "INTERVIEW"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : app.status === "ASSESSMENT"
                                  ? "bg-amber-100 text-amber-800"
                                  : app.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {app.status}
                            </span>
                            {app.jobPostingUrl && (
                              <a
                                href={app.jobPostingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-gray-700"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-[#EAE5DC] text-center text-slate-400 text-xs">
                      No applications recorded yet. Click "Log Application" above.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENTS */}
              {activeTab === "payments" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Payment & Subscription
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Total Fee: {formatCurrency(client.totalFee)} | Paid:{" "}
                        {formatCurrency(client.amountPaid)} | Balance:{" "}
                        {formatCurrency(client.balance)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddPayment(!showAddPayment)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#E86328] hover:bg-[#D2541C] text-white rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Record Payment</span>
                    </button>
                  </div>

                  {showAddPayment && (
                    <form
                      onSubmit={handleAddPayment}
                      className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-800">Add Payment Transaction</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={payAmount}
                            onChange={(e) => setPayAmount(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Method</label>
                          <select
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value)}
                            className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                          >
                            <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                            <option value="Credit / Debit Card">Credit / Debit Card</option>
                            <option value="Net Banking">Net Banking</option>
                            <option value="Cash / Cheque">Cash / Cheque</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">
                            Reference / Trans ID
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. UPI-998811"
                            value={payRef}
                            onChange={(e) => setPayRef(e.target.value)}
                            className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddPayment(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs bg-[#E86328] text-white rounded-lg hover:bg-[#D2541C]"
                        >
                          Confirm Payment
                        </button>
                      </div>
                    </form>
                  )}

                  {client.payments && client.payments.length > 0 ? (
                    <div className="bg-white rounded-xl border border-[#EAE5DC] overflow-hidden divide-y divide-gray-100">
                      {client.payments.map((pay: any) => (
                        <div key={pay.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">
                              {formatCurrency(pay.amount)}
                            </div>
                            <div className="text-slate-500 mt-0.5">
                              {pay.paymentMethod} {pay.referenceNumber && `• Ref: ${pay.referenceNumber}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-full font-medium text-[11px] bg-emerald-100 text-emerald-800">
                              {pay.status}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {formatDate(pay.paymentDate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-[#EAE5DC] text-center text-slate-400 text-xs">
                      No payments recorded yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INTERVIEWS */}
              {activeTab === "interviews" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Scheduled & Past Interviews ({client.interviews?.length || 0})
                    </h3>
                    <button
                      onClick={() => setShowAddInterview(!showAddInterview)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#E86328] hover:bg-[#D2541C] text-white rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Schedule Interview</span>
                    </button>
                  </div>

                  {showAddInterview && (
                    <form
                      onSubmit={handleAddInterview}
                      className="bg-white p-4 rounded-xl border border-[#EAE5DC] space-y-3"
                    >
                      <h4 className="text-xs font-bold text-slate-800">Schedule New Interview</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Company (e.g. Zoho)"
                          value={interviewCompany}
                          onChange={(e) => setInterviewCompany(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Round (e.g. Round 1 - Technical)"
                          value={interviewRound}
                          onChange={(e) => setInterviewRound(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <input
                          type="datetime-local"
                          required
                          value={interviewTime}
                          onChange={(e) => setInterviewTime(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                        <input
                          type="url"
                          placeholder="Meeting Link (Google Meet / Teams)"
                          value={interviewLink}
                          onChange={(e) => setInterviewLink(e.target.value)}
                          className="px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddInterview(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs bg-[#E86328] text-white rounded-lg hover:bg-[#D2541C]"
                        >
                          Schedule
                        </button>
                      </div>
                    </form>
                  )}

                  {client.interviews && client.interviews.length > 0 ? (
                    <div className="bg-white rounded-xl border border-[#EAE5DC] overflow-hidden divide-y divide-gray-100">
                      {client.interviews.map((iv: any) => (
                        <div key={iv.id} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">{iv.companyName}</div>
                            <div className="text-slate-500 mt-0.5">{iv.round}</div>
                            <div className="text-[11px] text-[#E86328] font-medium mt-0.5">
                              {formatDateTime(iv.scheduledAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded-full font-medium text-[11px] bg-emerald-100 text-emerald-800">
                              {iv.status}
                            </span>
                            {iv.meetingLink && (
                              <a
                                href={iv.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-gray-700"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-[#EAE5DC] text-center text-slate-400 text-xs">
                      No interviews scheduled yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: COMMUNICATIONS */}
              {activeTab === "communications" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Recruiter Inbox Updates
                  </h3>
                  {client.recruiterCommunications && client.recruiterCommunications.length > 0 ? (
                    <div className="bg-white rounded-xl border border-[#EAE5DC] overflow-hidden divide-y divide-gray-100">
                      {client.recruiterCommunications.map((comm: any) => (
                        <div key={comm.id} className="p-3.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {comm.recruiterOrCompany}
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-medium text-[11px] bg-gray-100 text-slate-700">
                              {comm.type}
                            </span>
                          </div>
                          <div className="font-medium text-slate-700 mt-1">{comm.subject}</div>
                          <div className="text-slate-500 mt-0.5 line-clamp-2">{comm.preview}</div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {formatDateTime(comm.receivedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-[#EAE5DC] text-center text-slate-400 text-xs">
                      No recruiter messages linked to this client yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Client Notes & Internal Log
                  </h3>
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an internal note or update..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E86328] bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs bg-[#E86328] hover:bg-[#D2541C] text-white rounded-lg flex items-center gap-1 font-medium"
                    >
                      <Send size={12} />
                      <span>Post</span>
                    </button>
                  </form>

                  {client.clientNotes && client.clientNotes.length > 0 ? (
                    <div className="bg-white rounded-xl border border-[#EAE5DC] overflow-hidden divide-y divide-gray-100">
                      {client.clientNotes.map((note: any) => (
                        <div key={note.id} className="p-3.5 text-xs">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                            <span className="font-medium text-slate-600">{note.authorName}</span>
                            <span>{formatDateTime(note.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-[#EAE5DC] text-center text-slate-400 text-xs">
                      No notes yet. Use the input above to log notes.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Stage & Activity History
                  </h3>
                  {client.stageHistory && client.stageHistory.length > 0 ? (
                    <div className="bg-white rounded-xl border border-[#EAE5DC] overflow-hidden divide-y divide-gray-100">
                      {client.stageHistory.map((h: any) => (
                        <div key={h.id} className="p-3.5 text-xs flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#E86328] mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">
                              {h.previousStage} &rarr; {h.newStage}
                            </div>
                            <div className="text-slate-500 mt-0.5">{h.notes}</div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              By {h.changedBy} on {formatDateTime(h.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-xl border border-[#EAE5DC] text-center text-slate-400 text-xs">
                      No stage history recorded yet.
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
