import { CheckCircle2 } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  title: string;
  description: string;
  buttonLabel?: string;
  onClose: () => void;
}

export function SuccessModal({
  open,
  title,
  description,
  buttonLabel = "ตกลง",
  onClose,
}: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/32 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white/95 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f5ef] text-[#007946]">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[#007946] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,121,70,0.22)] transition hover:bg-[#00663b]"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
