"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  ShieldCheck,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Briefcase,
  Sparkles,
} from "lucide-react";

export type RoleType = "candidate" | "staff" | "admin";
type CandidateStep = "email" | "first_login_otp" | "password" | "forgot_otp";

interface UnifiedLoginCardProps {
  initialRole?: RoleType;
}

export function UnifiedLoginCard({ initialRole = "candidate" }: UnifiedLoginCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role Switcher State
  const [activeRole, setActiveRole] = useState<RoleType>(initialRole);

  // Sync role with query param if present
  useEffect(() => {
    const roleParam = searchParams.get("role")?.toLowerCase();
    if (roleParam === "candidate" || roleParam === "staff" || roleParam === "admin") {
      setActiveRole(roleParam as RoleType);
    }
  }, [searchParams]);

  const handleRoleChange = (role: RoleType) => {
    setActiveRole(role);
    setError(null);
    setSuccessMsg(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("role", role);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ==========================================
  // CANDIDATE AUTH STATE & HANDLERS
  // ==========================================
  const [cxStep, setCxStep] = useState<CandidateStep>("email");
  const [cxEmail, setCxEmail] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [cxOtpCode, setCxOtpCode] = useState("");
  const [cxPassword, setCxPassword] = useState("");
  const [cxConfirmPassword, setCxConfirmPassword] = useState("");
  const [showCxPassword, setShowCxPassword] = useState(false);
  const [showCxConfirmPassword, setShowCxConfirmPassword] = useState(false);

  // Direct token login check
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      performTokenLogin(tokenParam);
    }
  }, [searchParams]);

  const performTokenLogin = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Token login failed.");
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch {
      setError("Unable to connect to candidate portal server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCxEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cxEmail.trim()) {
      setError("Please enter your registered candidate email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/portal/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cxEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to find candidate account with this email.");
        return;
      }

      setCandidateName(data.candidateName || "");

      if (data.isFirstLogin) {
        setCxStep("first_login_otp");
        setSuccessMsg(
          data.message ||
            `A 6-digit verification code has been sent to ${cxEmail.trim()}. Please check your email inbox.`
        );
      } else {
        setCxStep("password");
        setSuccessMsg(`Welcome back, ${data.candidateName || "Candidate"}! Please enter your password.`);
      }
    } catch {
      setError("Failed to connect to authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCxFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cxOtpCode.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (cxPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (cxPassword !== cxConfirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/auth/verify-first-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cxEmail.trim(),
          otpCode: cxOtpCode.trim(),
          password: cxPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed. Please check the OTP code.");
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch {
      setError("Failed to complete account setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCxPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cxPassword) {
      setError("Please enter your candidate password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cxEmail.trim(),
          password: cxPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect password. Please try again.");
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCxForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cxEmail.trim(),
          reason: "FORGOT_PASSWORD",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code.");
        return;
      }

      setCxStep("forgot_otp");
      setCxOtpCode("");
      setCxPassword("");
      setCxConfirmPassword("");
      setSuccessMsg(
        data.message || `Password reset code sent to ${cxEmail.trim()}. Please check your inbox.`
      );
    } catch {
      setError("Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCxResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cxOtpCode.trim()) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    if (cxPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (cxPassword !== cxConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cxEmail.trim(),
          otpCode: cxOtpCode.trim(),
          newPassword: cxPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCxResendOtp = async (reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cxEmail.trim(),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }
      setSuccessMsg(`A fresh verification OTP has been sent to ${cxEmail.trim()}.`);
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STAFF AUTH STATE & HANDLERS
  // ==========================================
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPasscode, setStaffPasscode] = useState("STAFF2026");
  const [showStaffPasscode, setShowStaffPasscode] = useState(false);

  const demoStaffMembers = [
    { name: "Arun K", role: "Specialist", email: "arun.k@jobassist.internal" },
    { name: "Divya S", role: "Manager", email: "divya.s@jobassist.internal" },
  ];

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffPasscode.trim()) {
      setError("Please enter the Staff access code (e.g. STAFF2026).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffEmail.trim(),
          passcode: staffPasscode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Staff login failed. Please verify credentials.");
        return;
      }

      router.push("/staff/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to staff authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADMIN AUTH STATE & HANDLERS
  // ==========================================
  const [adminSecretCode, setAdminSecretCode] = useState("");
  const [showAdminCode, setShowAdminCode] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecretCode.trim()) {
      setError("Please enter the Admin secret code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretCode: adminSecretCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid secret code. Please check your admin credentials.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect to admin authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Role metadata - Unified in Brand Orange & Black
  const roleMeta = {
    candidate: {
      badge: "Candidate Sign In",
      title: "JobAssist Candidate Portal",
      subtitle: "Real-time tracking of applications & interviews",
      footerNote: "Read-only candidate view. Internal staff notes remain private.",
    },
    staff: {
      badge: "Staff Sign In",
      title: "JobAssist Staff Workspace",
      subtitle: "Career specialist dashboard & client target tracking",
      footerNote: "Internal staff workspace. Pipeline action audit active.",
    },
    admin: {
      badge: "Admin Master Access",
      title: "JobAssist Admin CRM",
      subtitle: "Master executive access & system configuration",
      footerNote: "Executive master clearance. Authorized access with audit trail.",
    },
  }[activeRole];

  return (
    <div className="w-full max-w-[430px] mx-auto select-none transition-all duration-300">
      {/* Brand Header - Clean, balanced alignment */}
      <div className="text-center mb-3">
        <div className="relative inline-flex items-center justify-center mb-1.5">
          <div className="w-10 h-10 rounded-xl bg-[#E86328] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-950/50 border border-orange-500/30">
            J
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded-full bg-[#18100A] text-[#E86328] border border-orange-600/40 shadow-xs">
            {activeRole === "candidate" ? "Cx" : activeRole === "staff" ? "Staff" : "Admin"}
          </span>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-tight">
          {roleMeta.title}
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {roleMeta.subtitle}
        </p>
      </div>

      {/* Main Dark Login Box Container - Pure Orange & Black Palette */}
      <div className="bg-[#0E1420]/95 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl shadow-black/90 overflow-hidden">
        {/* ======================================================== */}
        {/* ANIMATED 3-WAY SEGMENTED CONTROL: Candidate | Staff | Admin */}
        {/* ======================================================== */}
        <div className="p-2 bg-[#0A0E17]/90 border-b border-slate-800">
          <div className="relative grid grid-cols-3 p-1 bg-[#131B29] rounded-xl select-none border border-slate-800">
            {/* Sliding Pill Indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[#1D2636] shadow-sm border border-slate-700/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: "calc(33.333% - 4px)",
                left:
                  activeRole === "candidate"
                    ? "2px"
                    : activeRole === "staff"
                    ? "calc(33.333% + 2px)"
                    : "calc(66.666% + 2px)",
              }}
            />

            {/* Left Button: Candidate */}
            <button
              type="button"
              onClick={() => handleRoleChange("candidate")}
              className={`relative z-10 py-1.5 px-1 text-center text-xs rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                activeRole === "candidate"
                  ? "text-white font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <User
                size={13}
                className={activeRole === "candidate" ? "text-[#E86328]" : "text-slate-500"}
              />
              <span>Candidate</span>
            </button>

            {/* Mid Button: Staff */}
            <button
              type="button"
              onClick={() => handleRoleChange("staff")}
              className={`relative z-10 py-1.5 px-1 text-center text-xs rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                activeRole === "staff"
                  ? "text-white font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <Briefcase
                size={13}
                className={activeRole === "staff" ? "text-[#E86328]" : "text-slate-500"}
              />
              <span>Staff</span>
            </button>

            {/* Right Button: Admin */}
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`relative z-10 py-1.5 px-1 text-center text-xs rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                activeRole === "admin"
                  ? "text-white font-bold"
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <ShieldCheck
                size={13}
                className={activeRole === "admin" ? "text-[#E86328]" : "text-slate-500"}
              />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Messages */}
        {error && (
          <div className="mx-4 mt-2.5 p-2 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-1.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 mt-2.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-1.5">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* SLIDING CAROUSEL TRACK: 3 Panels (Left | Mid | Right)    */}
        {/* ======================================================== */}
        <div className="overflow-hidden w-full">
          <div
            className="flex w-[300%] transition-transform duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform:
                activeRole === "candidate"
                  ? "translateX(0%)"
                  : activeRole === "staff"
                  ? "translateX(-33.333333%)"
                  : "translateX(-66.666667%)",
            }}
          >
            {/* ---------------------------------------------------- */}
            {/* PANEL 1 (LEFT SIDE): CANDIDATE LOGIN                */}
            {/* ---------------------------------------------------- */}
            <div
              className={`w-1/3 shrink-0 p-4 sm:p-5 transition-all duration-300 ${
                activeRole === "candidate"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-30 scale-[0.98] pointer-events-none"
              }`}
            >
              <div className="mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#E86328]">
                    {cxStep === "email" && "Candidate Sign In"}
                    {cxStep === "first_login_otp" && "First-Time Registration"}
                    {cxStep === "password" && "Password Verification"}
                    {cxStep === "forgot_otp" && "Password Reset"}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5">
                    {cxStep === "email" && "Enter Registered Email"}
                    {cxStep === "first_login_otp" && `Welcome, ${candidateName || "Candidate"}!`}
                    {cxStep === "password" && `Welcome Back, ${candidateName || "Candidate"}!`}
                    {cxStep === "forgot_otp" && "Reset Password"}
                  </h3>
                </div>

                {cxStep !== "email" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCxStep("email");
                      setError(null);
                      setSuccessMsg(null);
                      setCxPassword("");
                      setCxConfirmPassword("");
                      setCxOtpCode("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                  >
                    <ArrowLeft size={12} />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {/* Step 1: Candidate Email Form */}
              {cxStep === "email" && (
                <form onSubmit={handleCxEmailSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={cxEmail}
                        onChange={(e) => setCxEmail(e.target.value)}
                        placeholder="e.g. priya.joka@gmail.com"
                        required
                        autoFocus={activeRole === "candidate"}
                        className="w-full pl-9 pr-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-1">
                      First time? We will send a 6-digit OTP to verify and set your password.
                    </p>
                  </div>

                  {/* UNIFIED ORANGE BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-950/40 disabled:opacity-60 group"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Verifying Email...</span>
                      </span>
                    ) : (
                      <>
                        <span>Continue to Portal</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Demo Pre-fill */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Demo Candidate:</span>
                    <button
                      type="button"
                      onClick={() => setCxEmail("aarav.kumar@gmail.com")}
                      className="font-medium text-[#E86328] hover:underline bg-[#1F150F] px-2 py-0.5 rounded border border-orange-900/60"
                    >
                      aarav.kumar@gmail.com
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2A: First-Time OTP & Set Password */}
              {cxStep === "first_login_otp" && (
                <form onSubmit={handleCxFirstLoginSubmit} className="space-y-3">
                  <div className="p-2 bg-orange-950/30 border border-orange-900/60 rounded-xl text-xs text-orange-200">
                    <p className="font-semibold text-orange-300">Account Verified!</p>
                    <p className="mt-0.5 text-slate-300">Enter OTP sent to <strong className="font-mono text-white">{cxEmail}</strong></p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      6-Digit Code (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={cxOtpCode}
                      onChange={(e) => setCxOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      required
                      className="w-full py-1.5 bg-[#080C14] border border-slate-800 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        New Password
                      </label>
                      <input
                        type={showCxPassword ? "text" : "password"}
                        value={cxPassword}
                        onChange={(e) => setCxPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        required
                        className="w-full px-3 py-1.5 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Confirm
                      </label>
                      <input
                        type={showCxConfirmPassword ? "text" : "password"}
                        value={cxConfirmPassword}
                        onChange={(e) => setCxConfirmPassword(e.target.value)}
                        placeholder="Re-enter"
                        required
                        className="w-full px-3 py-1.5 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-60"
                  >
                    {loading ? "Activating Candidate Portal..." : "Set Password & Enter Portal →"}
                  </button>

                  <div className="flex justify-end text-xs">
                    <button
                      type="button"
                      onClick={() => handleCxResendOtp("FIRST_LOGIN")}
                      disabled={loading}
                      className="text-[#E86328] hover:underline"
                    >
                      Resend OTP Code
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2B: Returning Candidate Password */}
              {cxStep === "password" && (
                <form onSubmit={handleCxPasswordSubmit} className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-slate-300">
                    <span className="truncate max-w-[220px]">{cxEmail}</span>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-900/80">
                      Active
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={handleCxForgotPassword}
                        className="text-xs text-[#E86328] hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showCxPassword ? "text" : "password"}
                        value={cxPassword}
                        onChange={(e) => setCxPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        autoFocus
                        className="w-full pl-9 pr-9 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCxPassword(!showCxPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCxPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Logging in...</span>
                      </span>
                    ) : (
                      <>
                        <span>Log In to Portal</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 3: Forgot Password OTP */}
              {cxStep === "forgot_otp" && (
                <form onSubmit={handleCxResetPasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reset OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={cxOtpCode}
                      onChange={(e) => setCxOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit OTP"
                      required
                      className="w-full py-1.5 bg-[#080C14] border border-slate-800 rounded-xl text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="password"
                        value={cxPassword}
                        onChange={(e) => setCxPassword(e.target.value)}
                        placeholder="New password"
                        required
                        className="w-full px-3 py-1.5 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={cxConfirmPassword}
                        onChange={(e) => setCxConfirmPassword(e.target.value)}
                        placeholder="Confirm"
                        required
                        className="w-full px-3 py-1.5 bg-[#080C14] border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-60"
                  >
                    {loading ? "Updating..." : "Update Password & Log In →"}
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setCxStep("password")}
                      className="text-slate-400 hover:text-white"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCxResendOtp("FORGOT_PASSWORD")}
                      disabled={loading}
                      className="text-[#E86328] hover:underline"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* PANEL 2 (MID): STAFF LOGIN                           */}
            {/* ---------------------------------------------------- */}
            <div
              className={`w-1/3 shrink-0 p-4 sm:p-5 transition-all duration-300 ${
                activeRole === "staff"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-30 scale-[0.98] pointer-events-none"
              }`}
            >
              <div className="mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#E86328]">
                    Staff Workspace
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5">
                    Career Specialist Sign In
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-orange-300 bg-orange-950/60 border border-orange-800/80 px-2 py-0.5 rounded-full">
                  Internal Team
                </span>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Work Email
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="e.g. arun.k@jobassist.internal"
                      autoFocus={activeRole === "staff"}
                      className="w-full pl-9 pr-3 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] font-mono transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Passcode
                  </label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showStaffPasscode ? "text" : "password"}
                      value={staffPasscode}
                      onChange={(e) => setStaffPasscode(e.target.value)}
                      placeholder="STAFF2026"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] font-mono tracking-wider transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPasscode(!showStaffPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showStaffPasscode ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* UNIFIED ORANGE BUTTON (NO BLUE) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-950/40 disabled:opacity-60 group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Authenticating...</span>
                    </span>
                  ) : (
                    <>
                      <span>Enter Staff Workspace</span>
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Quick Staff Selectors in Brand Colors */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Quick Select Staff Profile:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {demoStaffMembers.map((member) => (
                      <button
                        key={member.email}
                        type="button"
                        onClick={() => {
                          setStaffEmail(member.email);
                          setStaffPasscode("STAFF2026");
                        }}
                        className={`text-left p-1.5 rounded-lg border text-xs transition-all flex flex-col ${
                          staffEmail === member.email
                            ? "bg-[#1F140D] border-[#E86328] text-orange-200 font-bold"
                            : "bg-[#080C14] border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="font-semibold truncate">{member.name}</span>
                        <span className="text-[10px] text-slate-500 truncate">{member.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* ---------------------------------------------------- */}
            {/* PANEL 3 (RIGHT SIDE): ADMIN LOGIN                   */}
            {/* ---------------------------------------------------- */}
            <div
              className={`w-1/3 shrink-0 p-4 sm:p-5 transition-all duration-300 ${
                activeRole === "admin"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-30 scale-[0.98] pointer-events-none"
              }`}
            >
              <div className="mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#E86328]">
                    Admin Authentication
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5">
                    Master Executive Access
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-orange-300 bg-orange-950/60 border border-orange-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock size={9} />
                  <span>Restricted</span>
                </span>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Master Passcode
                  </label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showAdminCode ? "text" : "password"}
                      value={adminSecretCode}
                      onChange={(e) => setAdminSecretCode(e.target.value)}
                      placeholder="e.g. ADMIN2026"
                      required
                      autoFocus={activeRole === "admin"}
                      className="w-full pl-9 pr-9 py-2 bg-[#080C14] border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] font-mono tracking-wider transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminCode(!showAdminCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showAdminCode ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Enter master private key for full CRM system controls.
                  </p>
                </div>

                {/* UNIFIED ORANGE BUTTON (NO RED) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-950/40 disabled:opacity-60 group"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Verifying Master Passcode...</span>
                    </span>
                  ) : (
                    <>
                      <span>Unlock Master CRM</span>
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Default Code Pre-fill */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Default Code:</span>
                  <button
                    type="button"
                    onClick={() => setAdminSecretCode("ADMIN2026")}
                    className="font-mono font-bold text-[#E86328] hover:underline bg-[#1F150F] px-2 py-0.5 rounded border border-orange-900/60 flex items-center gap-1"
                  >
                    <Sparkles size={11} className="text-[#E86328]" />
                    <span>ADMIN2026</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Level Indicator below the box */}
      <div className="mt-2.5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 transition-all duration-300">
        <ShieldCheck size={13} className="text-[#E86328]" />
        <span>{roleMeta.footerNote}</span>
      </div>
    </div>
  );
}
