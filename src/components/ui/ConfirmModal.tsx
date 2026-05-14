import { CircleAlert } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description = "",
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/32 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white/95 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f5ef] text-[#007946]">
          <CircleAlert className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-w-28 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-w-32 items-center justify-center rounded-2xl bg-[#007946] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,121,70,0.22)] transition hover:bg-[#00663b]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
