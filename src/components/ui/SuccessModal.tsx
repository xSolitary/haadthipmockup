import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ActionModalFrame } from "@/components/ui/ActionModalFrame";

interface SuccessModalProps {
  open: boolean;
  title: string;
  description: ReactNode;
  buttonLabel?: string;
  variant?: "success" | "warning";
  onClose: () => void;
}

export function SuccessModal({
  open,
  title,
  description,
  buttonLabel = "ตกลง",
  variant = "success",
  onClose,
}: SuccessModalProps) {
  return (
    <ActionModalFrame
      open={open}
      onClose={onClose}
      icon={
        variant === "warning" ? <AlertTriangle className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />
      }
      title={title}
      description={description}
    >
      <button
        type="button"
        onClick={onClose}
        className="inline-flex min-w-32 items-center justify-center rounded-2xl bg-[#007946] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,121,70,0.22)] transition hover:bg-[#00663b]"
      >
        {buttonLabel}
      </button>
    </ActionModalFrame>
  );
}
