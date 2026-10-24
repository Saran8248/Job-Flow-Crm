"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  Plus,
  RefreshCw,
  Mail,
  Briefcase,
  Users,
  Send,
  FileCheck2,
  CalendarCheck2,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { STAGES, StageKey } from "@/lib/types";
import { ClientDrawer } from "@/components/ClientDrawer";

interface StaffClient {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  currentStage: StageKey;
  planDurationMonths: number;
  totalApplications: number;
  totalInterviews: number;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
  clientsCount: number;
  appliedCount: number;
  assessmentCount: number;
  interviewCount: number;
  clients: StaffClient[];
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingClientsStaff, setViewingClientsStaff] = useState<StaffMember | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Career Specialist");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setName("");
    setEmail("");
    setRole("Career Specialist");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email);
    setRole(staff.role);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !role.trim()) {
      setFormError("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : "/api/staff";
      const method = editingStaff ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role: role.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save staff member");
      }

      setIsAddModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    const confirmMsg =
      staff.clientsCount > 0
        ? `Staff member "${staff.name}" currently manages ${staff.clientsCount} clients. Deleting them will unassign these clients. Are you sure?`
        : `Are you sure you want to delete staff member "${staff.name}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchStaffData();
      } else {
        alert("Failed to delete staff member");
      }
    } catch {
      alert("Error deleting staff member");
    }
  };

  // Overall totals
  const totalClientsManaged = staffList.reduce((sum, s) => sum + s.clientsCount, 0);
  const totalApplied = staffList.reduce((sum, s) => sum + s.appliedCount, 0);
  const totalAssessments = staffList.reduce((sum, s) => sum + s.assessmentCount, 0);
  const totalInterviews = staffList.reduce((sum, s) => sum + s.interviewCount, 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 lg:p-10 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#182232]">
            Staff
          </h1>
          <p className="text-xs text-[#717B8A] mt-1">
            Specialist workloads, client assignments, job applications, assessments, and interview tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStaffData()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-[#EAE5DC] transition-colors"
            title="Refresh Staff"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E86328] hover:bg-[#D2541C] text-white text-sm font-medium shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-xs">Specialists Active</span>
            <UserCheck size={16} className="text-[#E86328]" />
          </div>
          <p className="text-3xl font-bold text-[#182232] tracking-tight">
            {staffList.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-xs">Clients Maintaining</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-[#182232] tracking-tight">
            {totalClientsManaged}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-xs">Applications Applied</span>
            <Send size={16} className="text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-[#182232] tracking-tight">
            {totalApplied}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#EAE5DC] shadow-xs">
          <div className="flex items-center justify-between text-[#717B8A] mb-1">
            <span className="text-xs">Interviews Secured</span>
            <CalendarCheck2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-[#182232] tracking-tight">
            {totalInterviews}
          </p>
        </div>
      </div>

      {/* Staff Workload Table */}
      <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAE5DC] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#182232]">
              Staff Members & Workload Details
            </h2>
            <p className="text-xs text-[#717B8A] mt-0.5">
              Newly added staff names automatically reflect inside the client assignment dropdowns.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {staffList.length} Staff Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAE5DC] bg-[#FAF7F2]/40 text-[#717B8A] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-center">Clients Maintaining</th>
                <th className="py-3.5 px-4 text-center">Applied Count</th>
                <th className="py-3.5 px-4 text-center">Assessment Count</th>
                <th className="py-3.5 px-4 text-center">Interview Count</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1EBE1]">
              {staffList.map((staff) => (
                <tr
                  key={staff.id}
                  className="hover:bg-[#FAF7F2]/50 transition-colors"
                >
                  {/* STAFF MEMBER */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E86328]/10 text-[#E86328] font-bold text-xs flex items-center justify-center shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-[#182232] text-sm">
                          {staff.name}
                        </div>
                        <div className="text-[11px] text-[#717B8A] flex items-center gap-1 mt-0.5">
                          <Mail size={11} />
                          <span>{staff.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="py-4 px-4 text-[#182232] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-slate-400" />
                      <span>{staff.role}</span>
                    </div>
                  </td>

                  {/* CLIENTS MAINTAINING */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setViewingClientsStaff(staff)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      title="Click to view assigned clients"
                    >
                      <Users size={12} />
                      <span>{staff.clientsCount} Clients</span>
                    </button>
                  </td>

                  {/* APPLIED COUNT */}
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {staff.appliedCount}
                    </span>
                  </td>

                  {/* ASSESSMENT COUNT */}
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                      {staff.assessmentCount}
                    </span>
                  </td>

                  {/* INTERVIEW COUNT */}
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {staff.interviewCount}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{staff.accountStatus}</span>
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(staff)}
                        className="p-1.5 text-slate-500 hover:text-[#E86328] hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Staff Member"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Staff Member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {staffList.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No staff members found. Click "Add Staff Member" to enroll specialists.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-[#EAE5DC] bg-[#FAF7F2]/40 text-xs text-[#717B8A] flex items-center justify-between">
          <span>All staff names appear instantly when assigning clients</span>
          <span className="text-[11px]">Real-time Workload Sync</span>
        </div>
      </div>

      {/* MODAL: ADD / EDIT STAFF */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#EAE5DC]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DC]">
              <h2 className="text-base font-bold text-[#182232]">
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun K, Pooja Hegde"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. arun.k@jobassist.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role / Specialization <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Career Specialist, Application Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E86328]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE5DC]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs bg-[#E86328] hover:bg-[#D2541C] text-white rounded-lg font-medium transition-colors"
                >
                  {submitting ? "Saving..." : editingStaff ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW CLIENTS MAINTAINED BY STAFF */}
      {viewingClientsStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-[#EAE5DC] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DC]">
              <div>
                <h2 className="text-base font-bold text-[#182232]">
                  Clients Maintained by {viewingClientsStaff.name}
                </h2>
                <p className="text-xs text-[#717B8A] mt-0.5">
                  {viewingClientsStaff.role} • {viewingClientsStaff.clientsCount} Active Clients
                </p>
              </div>
              <button
                onClick={() => setViewingClientsStaff(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {viewingClientsStaff.clients && viewingClientsStaff.clients.length > 0 ? (
                viewingClientsStaff.clients.map((c) => {
                  const stage = STAGES[c.currentStage] || {
                    label: c.currentStage,
                    pillBg: "bg-gray-100",
                    pillText: "text-gray-700",
                  };

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClientId(c.id);
                        setViewingClientsStaff(null);
                      }}
                      className="p-3 rounded-lg border border-[#EAE5DC] hover:border-[#E86328] hover:bg-[#FAF7F2]/40 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#182232] group-hover:text-[#E86328] transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[#717B8A] mt-0.5">
                          {c.targetRole} • {c.planDurationMonths} Month Plan
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${stage.pillBg} ${stage.pillText}`}
                          >
                            {stage.label}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {c.totalApplications} apps • {c.totalInterviews} interviews
                          </div>
                        </div>
                        <ExternalLink size={13} className="text-slate-400 group-hover:text-[#E86328]" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No clients currently assigned to this specialist.
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#EAE5DC] flex justify-end">
              <button
                onClick={() => setViewingClientsStaff(null)}
                className="px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Drawer */}
      <ClientDrawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onUpdate={() => fetchStaffData()}
      />
    </div>
  );
}
