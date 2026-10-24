"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { STAGES, STAGE_LIST, StageKey } from "@/lib/types";

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [planDurationMonths, setPlanDurationMonths] = useState<number>(1);
  const [planStartDate, setPlanStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [planEndDate, setPlanEndDate] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [initialStage, setInitialStage] = useState<StageKey>("CONFIRMED");
  const [totalFee, setTotalFee] = useState<number>(15000);
  const [amountPaid, setAmountPaid] = useState<number>(15000);
  const [preferredLocation, setPreferredLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [skills, setSkills] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Auto calculate end date when start date or plan duration changes
  useEffect(() => {
    if (!planStartDate) return;
    const start = new Date(planStartDate);
    if (isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setMonth(end.getMonth() + planDurationMonths);
    setPlanEndDate(end.toISOString().split("T")[0]);
  }, [planStartDate, planDurationMonths]);

  // Fetch staff list on open
  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
        if (data.staff && data.staff.length > 0 && !assignedStaffId) {
          setAssignedStaffId(data.staff[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  const balance = Math.max(0, totalFee - amountPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Full name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!phone.trim()) errors.phone = "Phone number is required";
    if (!targetRole.trim()) errors.targetRole = "Target job role is required";
    if (!planStartDate) errors.planStartDate = "Start date is required";
    if (!planEndDate) errors.planEndDate = "End date is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          targetRole: targetRole.trim(),
          planDurationMonths,
          planStartDate,
          planEndDate,
          assignedStaffId: assignedStaffId || null,
          currentStage: initialStage,
          totalFee,
          amountPaid,
          preferredLocation: preferredLocation.trim() || null,
          experienceLevel: experienceLevel.trim() || null,
          skills: skills.trim() || null,
          resumeUrl: resumeUrl.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create client");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto border border-[#EAE5DC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DC]">
          <div>
            <h2 className="text-xl font-bold text-[#182232]">
              Add New Client
            </h2>
            <p className="text-xs text-[#717B8A] mt-0.5">
              Enter client profile, service package, and assignment details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* Section 1: Personal & Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#717B8A] mb-3">
              1. Client Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Raman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-[#E86328] focus:border-transparent`}
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.joka@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    fieldErrors.email ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-[#E86328] focus:border-transparent`}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-[#E86328] focus:border-transparent`}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Job Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    fieldErrors.targetRole
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-[#E86328] focus:border-transparent`}
                />
                {fieldErrors.targetRole && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.targetRole}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Plan & Assignment */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#717B8A] mb-3">
              2. Plan & Service Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Plan Duration
                </label>
                <select
                  value={planDurationMonths}
                  onChange={(e) => setPlanDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  End Date (Auto-calculated)
                </label>
                <input
                  type="date"
                  required
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Staff
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Initial Service Stage
                </label>
                <select
                  value={initialStage}
                  onChange={(e) => setInitialStage(e.target.value as StageKey)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                >
                  {STAGE_LIST.map((key) => (
                    <option key={key} value={key}>
                      {STAGES[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Daily Application Target
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  defaultValue={60}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#717B8A] mb-3">
              3. Payment & Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total Agreed Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={totalFee}
                  onChange={(e) => setTotalFee(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalFee}
                  step="500"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Outstanding Balance (Auto)
                </label>
                <div className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 font-semibold text-slate-800">
                  ₹{balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Optional Candidate Profile */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#717B8A] mb-3">
              4. Additional Details (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preferred Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore / Remote"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Experience Level
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3+ Years"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Core Skills
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Next.js, TypeScript, Tailwind"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resume Link / URL
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE5DC]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-[#E86328] hover:bg-[#D2541C] rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enrolling Client...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Save Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
