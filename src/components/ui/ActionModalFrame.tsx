import type { ReactNode } from "react";

interface ActionModalFrameProps {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}

export function ActionModalFrame({
  open,
  onClose,
  icon,
  title,
  description,
  children,
}: ActionModalFrameProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/32 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white/95 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f5ef] text-[#007946]">
            {icon}
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? <div className="mt-3 text-center text-sm leading-7 text-slate-600">{description}</div> : null}
        {children ? <div className="mt-8 flex justify-center">{children}</div> : null}
      </div>
    </div>
  );
}
