import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  badge?: string;
}

export function KpiCard({ label, value, trend, icon, badge }: KpiCardProps) {
  return (
    <div className="flex h-32 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 tracking-normal">{label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon ? <div className="text-[#007946]">{icon}</div> : null}
      </div>
      {trend ? <p className="mt-4 text-xs text-slate-500">{trend}</p> : null}
      {badge ? <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{badge}</span> : null}
    </div>
  );
}
