"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Building,
  MapPin,
  RefreshCw,
  Image as ImageIcon,
  Maximize2,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ApplicationItem {
  id: string;
  companyName: string;
  jobTitle: string;
  jobLocation?: string;
  jobPostingUrl?: string;
  applicationDate: string;
  status: string;
  portal?: string;
  proofImageUrl?: string | null;
  lastStatusAt?: string;
}

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [portalFilter, setPortalFilter] = useState("ALL");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (portalFilter !== "ALL") params.append("portal", portalFilter);
      params.append("page", page.toString());
      params.append("limit", "15");

      const res = await fetch(`/api/portal/applications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load candidate applications:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, portalFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ASSESSMENT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "INTERVIEW":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "OFFER":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "APPLIED":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase size={22} className="text-[#E86328]" />
            <span>Applications Sent on Your Behalf</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse all {total} targeted submissions filed by your Career Specialist
          </p>
        </div>

        <button
          onClick={() => fetchApplications()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:text-slate-900 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Chips / Tabs for quick status switching */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "ALL", label: "All Applications" },
          { key: "APPLIED", label: "Applied" },
          { key: "ASSESSMENT", label: "Assessment" },
          { key: "INTERVIEW", label: "Interview" },
          { key: "OFFER", label: "Offer" },
        ].map((tab) => {
          const count = counts[tab.key] || 0;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#E86328] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Portal Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 focus:border-[#E86328]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 shrink-0">
            Job Board:
          </label>
          <select
            value={portalFilter}
            onChange={(e) => {
              setPortalFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#E86328]/30 w-full sm:w-auto"
          >
            <option value="ALL">All Portals</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Naukri">Naukri</option>
            <option value="Indeed">Indeed</option>
            <option value="Foundit">Foundit</option>
            <option value="Instahyre">Instahyre</option>
          </select>
        </div>
      </div>

      {/* Applications Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Proof</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Job Title</th>
                <th className="px-5 py-3.5">Portal</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Applied Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Job Posting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-4">
                    {app.proofImageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxImageUrl(app.proofImageUrl!);
                          setLightboxTitle(`${app.jobTitle} @ ${app.companyName}`);
                        }}
                        className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-[#E86328] group transition-all shrink-0"
                        title="Click to view full screenshot proof"
                      >
                        <img
                          src={app.proofImageUrl}
                          alt="Application proof"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 size={11} className="text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{app.companyName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800 truncate max-w-[200px]">
                    {app.jobTitle}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {app.portal || "Direct"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin size={12} className="text-slate-400" />
                      {app.jobLocation || "Remote"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-[11px]">
                    {formatDate(app.applicationDate)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {app.jobPostingUrl ? (
                      <a
                        href={app.jobPostingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#E86328] hover:underline font-semibold text-[11px]"
                      >
                        <span>View</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {applications.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No applications found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {applications.map((app) => (
            <div key={app.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {app.companyName}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                    {app.jobTitle}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
                    app.status
                  )}`}
                >
                  {app.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>{app.portal || "Direct"} · {app.jobLocation || "Remote"}</span>
                <span>{formatDate(app.applicationDate)}</span>
              </div>

              {app.jobPostingUrl && (
                <div className="pt-2 border-t border-slate-100 text-right">
                  <a
                    href={app.jobPostingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E86328] hover:underline"
                  >
                    <span>View Posting</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ))}

          {applications.length === 0 && !loading && (
            <div className="text-center py-8 text-xs text-slate-400">
              No applications found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{applications.length}</span> of{" "}
            <span className="font-bold">{total}</span> applications
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-slate-800 text-xs px-1">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight size={16} />
            </button>
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
                {lightboxTitle || "Screenshot Proof of Application"}
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
