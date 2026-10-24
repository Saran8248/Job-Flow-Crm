export type StageKey =
  | "CONFIRMED"
  | "PAID"
  | "DETAILS_COLLECTED"
  | "DOCUMENTS_APPROVED"
  | "PORTAL_SETUP"
  | "APPLICATIONS_IN_PROGRESS"
  | "FOLLOW_UP"
  | "REPORT"
  | "RENEWED_CLOSED";

export interface StageConfig {
  key: StageKey;
  label: string;
  pillBg: string;
  pillText: string;
  dotColor: string;
}

export const STAGES: Record<StageKey, StageConfig> = {
  CONFIRMED: {
    key: "CONFIRMED",
    label: "Confirmed",
    pillBg: "bg-[#FEF3C7]",
    pillText: "text-[#92400E]",
    dotColor: "bg-[#D97706]",
  },
  PAID: {
    key: "PAID",
    label: "Paid",
    pillBg: "bg-[#D1FAE5]",
    pillText: "text-[#065F46]",
    dotColor: "bg-[#059669]",
  },
  DETAILS_COLLECTED: {
    key: "DETAILS_COLLECTED",
    label: "Details Collected",
    pillBg: "bg-[#E0E7FF]",
    pillText: "text-[#3730A3]",
    dotColor: "bg-[#4F46E5]",
  },
  DOCUMENTS_APPROVED: {
    key: "DOCUMENTS_APPROVED",
    label: "Documents Approved",
    pillBg: "bg-[#FCE7F3]",
    pillText: "text-[#9D174D]",
    dotColor: "bg-[#DB2777]",
  },
  PORTAL_SETUP: {
    key: "PORTAL_SETUP",
    label: "Portal Setup",
    pillBg: "bg-[#FFEDD5]",
    pillText: "text-[#9A3412]",
    dotColor: "bg-[#EA580C]",
  },
  APPLICATIONS_IN_PROGRESS: {
    key: "APPLICATIONS_IN_PROGRESS",
    label: "Applications in Progress",
    pillBg: "bg-[#FEF3C7]",
    pillText: "text-[#B45309]",
    dotColor: "bg-[#F59E0B]",
  },
  FOLLOW_UP: {
    key: "FOLLOW_UP",
    label: "Follow-up",
    pillBg: "bg-[#FEF9C3]",
    pillText: "text-[#854D0E]",
    dotColor: "bg-[#EAB308]",
  },
  REPORT: {
    key: "REPORT",
    label: "Report",
    pillBg: "bg-[#E0F2FE]",
    pillText: "text-[#075985]",
    dotColor: "bg-[#0284C7]",
  },
  RENEWED_CLOSED: {
    key: "RENEWED_CLOSED",
    label: "Renewed/Closed",
    pillBg: "bg-[#F3F4F6]",
    pillText: "text-[#4B5563]",
    dotColor: "bg-[#9CA3AF]",
  },
};

export const STAGE_LIST: StageKey[] = [
  "CONFIRMED",
  "PAID",
  "DETAILS_COLLECTED",
  "DOCUMENTS_APPROVED",
  "PORTAL_SETUP",
  "APPLICATIONS_IN_PROGRESS",
  "FOLLOW_UP",
  "REPORT",
  "RENEWED_CLOSED",
];

export type PaymentStatusKey = "PAID" | "PENDING" | "PARTIALLY_PAID" | "REFUNDED";

export interface PaymentStatusConfig {
  key: PaymentStatusKey;
  label: string;
  dotColor: string;
  textColor: string;
}

export const PAYMENT_STATUSES: Record<PaymentStatusKey, PaymentStatusConfig> = {
  PAID: {
    key: "PAID",
    label: "Paid",
    dotColor: "bg-emerald-500",
    textColor: "text-emerald-700",
  },
  PENDING: {
    key: "PENDING",
    label: "Pending",
    dotColor: "bg-amber-500",
    textColor: "text-amber-700",
  },
  PARTIALLY_PAID: {
    key: "PARTIALLY_PAID",
    label: "Partially Paid",
    dotColor: "bg-blue-500",
    textColor: "text-blue-700",
  },
  REFUNDED: {
    key: "REFUNDED",
    label: "Refunded",
    dotColor: "bg-gray-400",
    textColor: "text-gray-600",
  },
};

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  targetRole: string;
  preferredLocation?: string | null;
  experienceLevel?: string | null;
  skills?: string | null;
  resumeUrl?: string | null;
  currentStage: StageKey;
  paymentStatus: PaymentStatusKey;
  assignedStaffId?: string | null;
  staff?: {
    id: string;
    name: string;
    email: string;
  } | null;
  totalFee: number;
  amountPaid: number;
  balance: number;
  planDurationMonths: number;
  planStartDate: string;
  planEndDate: string;
  dailyTarget: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
    payments: number;
    interviews: number;
    recruiterCommunications: number;
  };
  todayApplicationsCount?: number;
  totalApplicationsCount?: number;
}
