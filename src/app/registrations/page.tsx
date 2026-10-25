"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  RefreshCw,
  Search,
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  Copy,
  Check,
  Eye,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CandidateRegistrationItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  targetRole: string;
  portalEnabled: boolean;
  portalToken?: string | null;
  registrationStatus: string;
  isFirstLogin: boolean;
  hasPassword: boolean;
  currentStage: string;
  createdAt: string;
  staff?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export default function CxRegistrationsPage() {
  const [candidates, setCandidates] = useState<CandidateRegistrationItem[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Password Modal State
  const [passwordModalCandidate, setPasswordModalCandidate] = useState<CandidateRegistrationItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Toast / Feedback
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, staffRes] = await Promise.all([
        fetch("/api/registrations"),
        fetch("/api/staff"),
      ]);

      if (regRes.ok) {
        const data = await regRes.json();
        setCandidates(data.candidates || []);
      }

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setToast(null);

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          targetRole,
          assignedStaffId: assignedStaffId || null,
          password: initialPassword || undefined,
          portalEnabled: autoApprove,
          registrationStatus: autoApprove ? "APPROVED" : "PENDING",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ text: data.error || "Failed to register candidate", type: "error" });
        return;
      }

      setToast({
        text: `Candidate "${name}" registered successfully! Portal access: ${autoApprove ? "Approved" : "Pending"}.`,
        type: "success",
      });

      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setTargetRole("");
      setInitialPassword("");
      setShowRegisterForm(false);
      await fetchRegistrations();
    } catch {
      setToast({ text: "Failed to connect to registration server", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleApproval = async (candidate: CandidateRegistrationItem) => {
    const newStatus = candidate.registrationStatus === "APPROVED" ? "PENDING" : "APPROVED";
    try {
      const res = await fetch(`/api/registrations/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationStatus: newStatus,
          portalEnabled: newStatus === "APPROVED",
        }),
      });

      if (res.ok) {
        setToast({
          text: `Access for ${candidate.name} updated to: ${newStatus === "APPROVED" ? "Approved & Accepted" : "Pending / Disabled"}`,
          type: "success",
        });
        await fetchRegistrations();
      }
    } catch {
      setToast({ text: "Failed to update candidate approval status", type: "error" });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalCandidate || !newPassword.trim()) return;

    if (newPassword.trim().length < 6) {
      setToast({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/registrations/${passwordModalCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword.trim() }),
      });

      if (res.ok) {
        setToast({
          text: `New password assigned for ${passwordModalCandidate.name}. They can now log in directly!`,
          type: "success",
        });
        setPasswordModalCandidate(null);
        setNewPassword("");
        await fetchRegistrations();
      }
    } catch {
      setToast({ text: "Failed to set password", type: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetToOtp = async (candidate: CandidateRegistrationItem) => {
    if (!confirm(`Reset credentials for ${candidate.name}? They will be required to verify OTP on their next login.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/registrations/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToOtp: true }),
      });

      if (res.ok) {
        setToast({
          text: `${candidate.name} reset to First-Time OTP mode.`,
          type: "success",
        });
        await fetchRegistrations();
      }
    } catch {
      setToast({ text: "Failed to reset to OTP mode", type: "error" });
    }
  };

  const handleDeleteCandidate = async (candidate: CandidateRegistrationItem) => {
    if (!confirm(`Are you sure you want to delete candidate "${candidate.name}" (${candidate.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/registrations/${candidate.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({
          text: `Candidate "${candidate.name}" deleted successfully.`,
          type: "success",
        });
        await fetchRegistrations();
      } else {
        setToast({ text: "Failed to delete candidate.", type: "error" });
      }
    } catch {
      setToast({ text: "Error deleting candidate.", type: "error" });
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.targetRole.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 lg:p-10 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#182232] flex items-center gap-2.5">
            <UserPlus size={24} className="text-[#E86328]" />
            <span>Cx Registration & Access Approval</span>
          </h1>
          <p className="text-xs text-[#717B8A] mt-1">
            Register candidates, assign login credentials, and approve access. Candidates can only log in once accepted here.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRegistrations()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-[#EAE5DC] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowRegisterForm(!showRegisterForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus size={15} />
            <span>{showRegisterForm ? "Close Form" : "Register Candidate"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Registration Form (Collapsible) */}
      {showRegisterForm && (
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5DC] shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Register New Candidate (User & Password Setup)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create the candidate account and configure their portal access approval.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Admin Entry
            </span>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh.v@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Role / Domain *
                </label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Specialist
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                >
                  <option value="">Select Specialist...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password (Optional)
                </label>
                <input
                  type="text"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Leave blank for First-Time OTP setup"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E86328] font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="rounded text-[#E86328] focus:ring-[#E86328] w-4 h-4"
                />
                <span>Approve & Accept Portal Access Immediately (Candidate can log in)</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Save & Register Candidate"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Candidate Accounts Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-xs overflow-hidden">
        {/* Search & Stats Bar */}
        <div className="p-4 border-b border-[#EAE5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name, email, role..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Candidates: <span className="font-bold text-slate-900">{candidates.length}</span> ·{" "}
            Approved:{" "}
            <span className="font-bold text-emerald-600">
              {candidates.filter((c) => c.portalEnabled).length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EAE5DC] text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-5 py-3.5">Target Role</th>
                <th className="px-5 py-3.5">Specialist</th>
                <th className="px-5 py-3.5">Portal Status</th>
                <th className="px-5 py-3.5">Credentials Mode</th>
                <th className="px-5 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Candidate Name & Email */}
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail size={11} className="text-slate-400" />
                      <span>{c.email}</span>
                    </div>
                  </td>

                  {/* Target Role */}
                  <td className="px-5 py-4 text-slate-700 font-medium">{c.targetRole}</td>

                  {/* Specialist */}
                  <td className="px-5 py-4 text-slate-600">
                    {c.staff?.name || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>

                  {/* Portal Status (Approved vs Pending) */}
                  <td className="px-5 py-4">
                    {c.portalEnabled && c.registrationStatus === "APPROVED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Approved & Accepted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <XCircle size={12} />
                        <span>Pending Approval</span>
                      </span>
                    )}
                  </td>

                  {/* Credentials Mode */}
                  <td className="px-5 py-4">
                    {c.hasPassword ? (
                      <span className="inline-block text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Password Active
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        Needs First-Time OTP
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                    {/* Approve / Revoke Access Toggle */}
                    <button
                      onClick={() => handleToggleApproval(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        c.portalEnabled && c.registrationStatus === "APPROVED"
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                      }`}
                    >
                      {c.portalEnabled && c.registrationStatus === "APPROVED" ? "Revoke Access" : "Accept & Approve"}
                    </button>

                    {/* Set Custom Password */}
                    <button
                      onClick={() => {
                        setPasswordModalCandidate(c);
                        setNewPassword("");
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium"
                      title="Set or reset candidate password"
                    >
                      Set Password
                    </button>

                    {/* Reset to OTP mode */}
                    {c.hasPassword && (
                      <button
                        onClick={() => handleResetToOtp(c)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-[11px]"
                        title="Force first-time OTP on next login"
                      >
                        Reset to OTP
                      </button>
                    )}

                    {/* Delete Candidate */}
                    <button
                      onClick={() => handleDeleteCandidate(c)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 text-xs transition-colors inline-flex items-center justify-center align-middle"
                      title="Delete Candidate"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredCandidates.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No candidate registrations found. Click &quot;Register Candidate&quot; above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Password Modal */}
      {passwordModalCandidate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={16} className="text-[#E86328]" />
              <h3 className="text-sm font-bold text-slate-900">
                Set Candidate Password
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Assign a permanent password for <span className="font-semibold text-slate-800">{passwordModalCandidate.name}</span> ({passwordModalCandidate.email}).
            </p>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. CandidatePass@2026"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E86328] font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalCandidate(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-1.5 bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {savingPassword ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
