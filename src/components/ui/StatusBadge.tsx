import { ReactNode } from "react";

const statusStyles: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "Pending Approval": "bg-amber-100 text-amber-800",
  Approved: "bg-[#f0f9f6] text-[#007946]",
  Rejected: "bg-rose-100 text-rose-800",
  "Revision Required": "bg-orange-100 text-orange-800",
  "Converted to PR": "bg-[#f0f9f6] text-[#007946]",
  "PR Created": "bg-[#f0f9f6] text-[#007946]",
  "Vendor Selected": "bg-blue-100 text-blue-800",
  "PO Created": "bg-violet-100 text-violet-800",
  "Pending PO Approval": "bg-amber-100 text-amber-800",
  "PO Approved": "bg-[#f0f9f6] text-[#007946]",
  "Sent to Vendor": "bg-cyan-100 text-cyan-800",
  "QC Pending": "bg-amber-100 text-amber-800",
  "QC Passed": "bg-emerald-100 text-emerald-800",
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
    <span className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-center text-xs font-semibold tracking-normal ${statusStyles[label] ?? "bg-slate-100 text-slate-800"}`}>
      {icon ? <span className="mr-2">{icon}</span> : null}
      {label}
    </span>
  );
}
