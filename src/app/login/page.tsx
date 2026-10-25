"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ShieldAlert, ArrowRight, Eye, EyeOff, Lock, UserCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secretCode, setSecretCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim()) {
      setError("Please enter the Admin secret code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretCode: secretCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid secret code. Please check your credentials.");
        return;
      }

      // Success: redirect to Main CRM Dashboard
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect to authentication server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-[#E86328] text-white items-center justify-center font-bold text-2xl shadow-md mb-3">
            J
          </div>
          <h1 className="text-2xl font-bold text-[#182232] tracking-tight">
            JobAssist Admin CRM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorized Personnel Only — Enter Secret Passcode
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl border border-[#EAE5DC] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <Lock size={16} className="text-[#E86328]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Admin Authentication
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Secret Code
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showCode ? "text" : "password"}
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Enter secret code (e.g. ADMIN2026)"
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328] font-mono tracking-wider transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your private admin master key to unlock full CRM features.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#E86328] hover:bg-[#D2541C] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-60"
            >
              {loading ? (
                <span>Verifying Secret Code...</span>
              ) : (
                <>
                  <span>Access Main CRM</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Default Code:</span>
            <button
              type="button"
              onClick={() => setSecretCode("ADMIN2026")}
              className="text-[11px] font-mono font-bold text-[#E86328] hover:underline bg-orange-50 px-2 py-0.5 rounded border border-orange-200"
            >
              ADMIN2026
            </button>
          </div>
        </div>

        {/* Switch to Candidate Portal */}
        <div className="mt-6 text-center">
          <Link
            href="/portal/login"
            className="text-xs text-slate-500 hover:text-[#E86328] transition-colors inline-flex items-center gap-1.5"
          >
            <UserCheck size={14} />
            <span>Looking for Candidate (Cx) Portal? Log in here &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
