import { ReactNode } from "react";
import { getStatusLabel } from "@/lib/ui-text";

const statusStyles: Record<string, string> = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  "Pending Approval": "border-amber-200 bg-amber-50 text-amber-800",
  Submitted: "border-blue-200 bg-blue-50 text-blue-700",
  Approved: "border-emerald-200 bg-[var(--primary-light)] text-[var(--primary-ink)]",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
  "Revision Required": "border-orange-200 bg-orange-50 text-orange-700",
  "Converted to PR": "border-emerald-200 bg-[var(--primary-light)] text-[var(--primary-ink)]",
  "PR Created": "border-emerald-200 bg-[var(--primary-light)] text-[var(--primary-ink)]",
  "Waiting for Purchasing to Propose Vendors": "border-lime-200 bg-lime-50 text-lime-800",
  "Pending PR Approval": "border-amber-200 bg-amber-50 text-amber-800",
  "Pending Vendor Approval": "border-amber-200 bg-amber-50 text-amber-800",
  "Vendor Approved": "border-blue-200 bg-blue-50 text-blue-700",
  "PO Created": "border-violet-200 bg-violet-50 text-violet-700",
  "Pending Receiving": "border-sky-200 bg-sky-50 text-sky-700",
  Received: "border-cyan-200 bg-cyan-50 text-cyan-700",
  "Pending PO Approval": "border-amber-200 bg-amber-50 text-amber-800",
  "PO Approved": "border-emerald-200 bg-[var(--primary-light)] text-[var(--primary-ink)]",
  "PO Rejected": "border-rose-200 bg-rose-50 text-rose-700",
  "Sent to Vendor": "border-cyan-200 bg-cyan-50 text-cyan-700",
  "QC Pending": "border-amber-200 bg-amber-50 text-amber-800",
  "QC Passed": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Vendor Selected": "border-blue-200 bg-blue-50 text-blue-700",
  "Payment Pending": "border-rose-200 bg-rose-50 text-rose-700",
  "Ready for AP Posting": "border-slate-200 bg-slate-100 text-slate-700",
  "Approved for Payment": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Paid: "border-slate-900 bg-slate-900 text-white",
};

interface StatusBadgeProps {
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({ label, icon, className = "" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex min-h-8 min-w-24 items-center justify-center rounded-full border px-3 py-1 text-center text-xs font-semibold tracking-normal shadow-sm ${statusStyles[label] ?? "border-slate-200 bg-slate-100 text-slate-800"} ${className}`}>
      {icon ? <span className="mr-2">{icon}</span> : null}
      {getStatusLabel(label)}
    </span>
  );
}
