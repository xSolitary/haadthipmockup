import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageHeader({ title, subtitle, actions, className = "", contentClassName = "" }: PageHeaderProps) {
  return (
    <div className={`mb-6 rounded-[30px] border border-[var(--border)] bg-[var(--surface)] px-5 py-6 shadow-[var(--shadow-sm)] sm:px-6 ${className}`}>
      <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${contentClassName}`}>
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-[var(--surface-tint)] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--primary-ink)]">
            ระบบงาน
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-[2rem]">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
