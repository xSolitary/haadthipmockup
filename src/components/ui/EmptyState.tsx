import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm shadow-slate-100">
      <p className="text-sm font-medium tracking-normal text-slate-400">{title}</p>
      <p className="mt-4 text-lg font-semibold text-slate-900">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
