"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

type LoginStep = "email" | "first_login_otp" | "password" | "forgot_otp";

export default function CandidateLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step state
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [candidateName, setCandidateName] = useState("");

  // OTP & Password Form states
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Secret token backward compatibility (if user visits /portal/login?token=...)
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
      setError("Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Email to Check Account & Approval Status
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/portal/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to find candidate account.");
        return;
      }

      setCandidateName(data.candidateName || "");

      if (data.isFirstLogin) {
        // First-time candidate -> needs OTP verification and password setup
        setStep("first_login_otp");
        setSuccessMsg(data.message || `A 6-digit verification code has been sent to ${email.trim()}. Please check your email inbox.`);
      } else {
        // Returning candidate -> proceed to direct password entry
        setStep("password");
        setSuccessMsg(`Welcome back, ${data.candidateName}! Please enter your password.`);
      }
    } catch {
      setError("Failed to connect to authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2A: Verify First-Time OTP & Set Permanent Password
  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
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
          email: email.trim(),
          otpCode: otpCode.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed. Please check the OTP.");
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

  // Step 2B: Returning Candidate Login with Email + Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
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
          email: email.trim(),
          password,
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

  // Step 3: Trigger Forgot Password OTP
  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          reason: "FORGOT_PASSWORD",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code.");
        return;
      }

      setStep("forgot_otp");
      setOtpCode("");
      setPassword("");
      setConfirmPassword("");
      setSuccessMsg(data.message || `Password reset code sent to ${email.trim()}. Please check your email inbox.`);
    } catch {
      setError("Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Verify Reset OTP & Update Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
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
          email: email.trim(),
          otpCode: otpCode.trim(),
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please check the code.");
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

  // Resend OTP helper
  const handleResendOtp = async (reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }
      setSuccessMsg(`A new verification OTP has been sent to ${email.trim()}. Please check your email inbox.`);
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EBE1]/50 flex flex-col justify-center items-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-[#E86328] text-white items-center justify-center font-bold text-2xl shadow-md mb-3">
            J
          </div>
          <h1 className="text-2xl font-bold text-[#182232] tracking-tight">
            JobAssist Candidate Portal
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Real-time tracking of your job applications, assessments, and interviews
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-sm p-6 sm:p-8">
          {/* Header Title per Step */}
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#E86328]">
                {step === "email" && "Candidate Sign In"}
                {step === "first_login_otp" && "First-Time Registration"}
                {step === "password" && "Password Verification"}
                {step === "forgot_otp" && "Password Reset"}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {step === "email" && "Enter Registered Email"}
                {step === "first_login_otp" && `Welcome, ${candidateName || "Candidate"}!`}
                {step === "password" && `Welcome Back, ${candidateName || "Candidate"}!`}
                {step === "forgot_otp" && "Reset Forgotten Password"}
              </h2>
            </div>

            {step !== "email" && (
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                  setSuccessMsg(null);
                  setPassword("");
                  setConfirmPassword("");
                  setOtpCode("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                title="Change email"
              >
                <ArrowLeft size={13} />
                <span>Change</span>
              </button>
            )}
          </div>

          {/* Feedback & Alerts */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !error && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}



          {/* STEP 1: Email Form */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya.joka@gmail.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  First time? We will send a 6-digit OTP to verify and set your password.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60"
              >
                {loading ? (
                  <span>Checking Registration...</span>
                ) : (
                  <>
                    <span>Continue to Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2A: First Time OTP & Set Password */}
          {step === "first_login_otp" && (
            <form onSubmit={handleFirstLoginSubmit} className="space-y-4">
              <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100 text-[11px] text-[#A03E10]">
                <strong>First-time account activation:</strong> Enter the OTP sent to{" "}
                <span className="font-semibold underline">{email}</span> and create your password.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] font-mono tracking-widest text-center text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Create Account Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60"
              >
                {loading ? (
                  <span>Verifying & Setting Password...</span>
                ) : (
                  <>
                    <span>Verify OTP & Enter Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleResendOtp("FIRST_LOGIN")}
                  disabled={loading}
                  className="text-[11px] text-[#E86328] hover:underline font-semibold"
                >
                  Didn&apos;t receive code? Resend OTP
                </button>
              </div>
            </form>
          )}

          {/* STEP 2B: Returning Candidate Password Login */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="text-xs text-slate-600 mb-2">
                Signing in as <strong className="text-slate-900">{email}</strong>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Candidate Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-[#E86328] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60"
              >
                {loading ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <span>Enter Candidate Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Forgot Password OTP & Reset */}
          {step === "forgot_otp" && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-900">
                A 6-digit password reset OTP has been sent to{" "}
                <span className="font-semibold underline">{email}</span>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    required
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] font-mono tracking-widest text-center text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create new password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60"
              >
                {loading ? (
                  <span>Resetting Password...</span>
                ) : (
                  <>
                    <span>Reset Password & Enter Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setStep("password")}
                  className="text-slate-500 hover:text-slate-800"
                >
                  &larr; Back to password login
                </button>
                <button
                  type="button"
                  onClick={() => handleResendOtp("FORGOT_PASSWORD")}
                  disabled={loading}
                  className="text-[#E86328] hover:underline font-semibold"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}


        </div>

        {/* Switch to Admin Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-[#E86328] transition-colors inline-flex items-center gap-1.5"
          >
            <Lock size={13} />
            <span>Staff or Administrator? Access Main CRM &rarr;</span>
          </Link>
        </div>

        {/* Security & Privacy assurance */}
        <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Read-only candidate view. Internal staff notes remain private.</span>
        </div>
      </div>
    </div>
  );
}