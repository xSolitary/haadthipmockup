import { CircleAlert } from "lucide-react";
import { ActionModalFrame } from "@/components/ui/ActionModalFrame";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description = "",
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmButtonClassName =
    confirmVariant === "danger"
      ? "inline-flex min-w-32 items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(225,29,72,0.22)] transition hover:bg-rose-700"
      : "inline-flex min-w-32 items-center justify-center rounded-2xl bg-[#007946] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,121,70,0.22)] transition hover:bg-[#00663b]";

  return (
    <ActionModalFrame
      open={open}
      onClose={onCancel}
      icon={<CircleAlert className="h-7 w-7" />}
      title={title}
      description={description}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
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
          className={confirmButtonClassName}
        >
          {confirmLabel}
        </button>
      </div>
    </ActionModalFrame>
  );
}
