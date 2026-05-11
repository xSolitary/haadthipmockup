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
    <div className="flex min-h-32 flex-col justify-between rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-normal text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {icon ? <div className="rounded-2xl bg-[var(--surface-tint)] p-3 text-[var(--primary)]">{icon}</div> : null}
      </div>
      {trend ? <p className="mt-4 text-xs text-slate-500">{trend}</p> : null}
      {badge ? <span className="mt-4 inline-flex rounded-full bg-[var(--surface-tint)] px-3 py-1 text-xs font-medium text-[var(--primary-ink)]">{badge}</span> : null}
    </div>
  );
}
