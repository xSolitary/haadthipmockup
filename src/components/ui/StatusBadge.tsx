import { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Pending: "bg-amber-100 text-amber-800",
  "Pending Approval": "bg-amber-100 text-amber-800",
  Submitted: "bg-blue-100 text-blue-800",
  Approved: "bg-[#f0f9f6] text-[#007946]",
  Rejected: "bg-rose-100 text-rose-800",
  "Revision Required": "bg-orange-100 text-orange-800",
  "Converted to PR": "bg-[#f0f9f6] text-[#007946]",
  "PR Created": "bg-[#f0f9f6] text-[#007946]",
  "Waiting for Purchasing to Propose Vendors": "bg-lime-100 text-lime-800",
  "Pending PR Approval": "bg-amber-100 text-amber-800",
  "Pending Vendor Approval": "bg-amber-100 text-amber-800",
  "Vendor Approved": "bg-blue-100 text-blue-800",
  "PO Created": "bg-violet-100 text-violet-800",
  "Pending Receiving": "bg-sky-100 text-sky-800",
  Received: "bg-cyan-100 text-cyan-800",
  "Pending PO Approval": "bg-amber-100 text-amber-800",
  "PO Approved": "bg-[#f0f9f6] text-[#007946]",
  "PO Rejected": "bg-rose-100 text-rose-800",
  "Sent to Vendor": "bg-cyan-100 text-cyan-800",
  "QC Pending": "bg-amber-100 text-amber-800",
  "QC Passed": "bg-emerald-100 text-emerald-800",
  "Vendor Selected": "bg-blue-100 text-blue-800",
  "Payment Pending": "bg-rose-100 text-rose-800",
  "Ready for AP Posting": "bg-slate-100 text-slate-800",
  "Approved for Payment": "bg-emerald-100 text-emerald-800",
  Paid: "bg-slate-900 text-white",
};

interface StatusBadgeProps {
  label: string;
  icon?: ReactNode;
}

export function StatusBadge({ label, icon }: StatusBadgeProps) {
  return (
    <span className={`inline-flex min-h-7 min-w-24 items-center justify-center rounded-full border border-white/50 px-3 py-1 text-center text-xs font-semibold tracking-normal shadow-sm ${statusStyles[label] ?? "bg-slate-100 text-slate-800"}`}>
      {icon ? <span className="mr-2">{icon}</span> : null}
      {label}
    </span>
  );
}
