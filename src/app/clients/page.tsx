"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  Eye,
  Edit,
  ArrowUpDown,
  Trash2,
  UserCheck,
  CreditCard,
  Briefcase,
  FileText,
  Clock,
} from "lucide-react";
import { STAGES, STAGE_LIST, StageKey, PAYMENT_STATUSES, PaymentStatusKey } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ClientModal } from "@/components/ClientModal";
import { ClientDrawer } from "@/components/ClientDrawer";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  planDurationMonths: number;
  paymentStatus: PaymentStatusKey;
  currentStage: StageKey;
  planEndDate: string;
  staff?: {
    name: string;
  } | null;
  totalApplicationsCount: number;
  balance: number;
  totalFee: number;
  amountPaid: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modals & Active drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (stageFilter !== "ALL") params.append("stage", stageFilter);
      if (paymentFilter !== "ALL") params.append("payment", paymentFilter);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await fetch(`/api/clients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, paymentFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  // Close open action menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveActionMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchClients();
      } else {
        alert("Failed to delete client");
      }
    } catch {
      alert("Error deleting client");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6 lg:p-10 font-sans">
      {/* 5.1 Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#182232]">
            Clients
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchClients()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-[#EAE5DC] transition-colors"
            title="Refresh Table"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E86328] hover:bg-[#D2541C] text-white text-sm font-medium shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>New client</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search input matching screenshot */}
        <div className="relative w-64 sm:w-72">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3.5 pr-8 py-1.5 text-xs rounded-lg border border-[#EAE5DC] bg-white text-[#182232] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E86328] shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Stage Filter Dropdown */}
        <div className="relative">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-1.5 text-xs rounded-lg border border-[#EAE5DC] bg-white text-[#182232] focus:outline-none focus:ring-1 focus:ring-[#E86328] shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Stages</option>
            {STAGE_LIST.map((key) => (
              <option key={key} value={key}>
                {STAGES[key].label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Payment Filter Dropdown */}
        <div className="relative">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-1.5 text-xs rounded-lg border border-[#EAE5DC] bg-white text-[#182232] focus:outline-none focus:ring-1 focus:ring-[#E86328] shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* 5.2 & 5.3 Clients Table */}
      <div className="bg-white rounded-xl border border-[#EAE5DC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#EAE5DC] bg-[#FAF7F2]/40 text-[#717B8A] font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-4">Target Role</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Ends</th>
                <th className="py-3.5 px-4">Staff</th>
                <th className="py-3.5 px-4 text-right">Applied</th>
                <th className="py-3.5 px-4 text-center w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1EBE1]">
              {clients.map((client) => {
                const stage = STAGES[client.currentStage] || {
                  label: client.currentStage,
                  pillBg: "bg-gray-100",
                  pillText: "text-gray-700",
                };
                const payment = PAYMENT_STATUSES[client.paymentStatus] || {
                  label: client.paymentStatus,
                  dotColor: "bg-gray-400",
                  textColor: "text-gray-700",
                };

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-[#FAF7F2]/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    {/* CLIENT */}
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-[#182232] group-hover:text-[#E86328] transition-colors">
                        {client.name}
                      </div>
                      <div className="text-[11px] text-[#717B8A] mt-0.5">
                        {client.email}
                      </div>
                    </td>

                    {/* TARGET ROLE */}
                    <td className="py-3.5 px-4 text-[#182232] font-medium">
                      {client.targetRole}
                    </td>

                    {/* PLAN */}
                    <td className="py-3.5 px-4 text-[#717B8A]">
                      {client.planDurationMonths} {client.planDurationMonths === 1 ? "Month" : "Months"}
                    </td>

                    {/* PAYMENT */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${payment.dotColor}`} />
                        <span className={`font-medium ${payment.textColor}`}>
                          {payment.label}
                        </span>
                      </div>
                    </td>

                    {/* STAGE */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${stage.pillBg} ${stage.pillText}`}
                      >
                        {stage.label}
                      </span>
                    </td>

                    {/* ENDS */}
                    <td className="py-3.5 px-4 text-[#717B8A]">
                      {formatDate(client.planEndDate)}
                    </td>

                    {/* STAFF */}
                    <td className="py-3.5 px-4 text-[#182232]">
                      {client.staff?.name || "—"}
                    </td>

                    {/* APPLIED */}
                    <td className="py-3.5 px-4 text-right font-semibold text-[#182232]">
                      {client.totalApplicationsCount || 0}
                    </td>

                    {/* ACTIONS MENU */}
                    <td
                      className="py-3.5 px-4 text-center relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenuId(
                            activeActionMenuId === client.id ? null : client.id
                          );
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeActionMenuId === client.id && (
                        <div className="absolute right-4 top-10 w-44 bg-white rounded-lg shadow-xl border border-[#EAE5DC] py-1 z-30 text-left">
                          <button
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye size={13} />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit size={13} />
                            <span>Update Stage</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <CreditCard size={13} />
                            <span>Record Payment</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Briefcase size={13} />
                            <span>Log Application</span>
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => {
                              handleDeleteClient(client.id, client.name);
                              setActiveActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <Trash2 size={13} />
                            <span>Delete Client</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {clients.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No clients found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3 border-t border-[#EAE5DC] bg-[#FAF7F2]/40 text-xs text-[#717B8A] flex items-center justify-between">
          <span>Showing {clients.length} clients</span>
          <span className="text-[11px]">JobAssist CRM Live Database</span>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchClients()}
      />

      <ClientDrawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onUpdate={() => fetchClients()}
      />
    </div>
  );
}
