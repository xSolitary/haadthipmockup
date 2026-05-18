"use client";

import { useParams } from "next/navigation";
import { MemoApprovalPage } from "@/components/memo/MemoApprovalPage";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProcurementStore } from "@/store/useProcurementStore";

export default function MemoActionPage() {
  const params = useParams<{ memoId: string }>();
  const currentRole = useProcurementStore((state) => state.currentRole);

  if (currentRole === "Vendor") {
    return (
      <div className="space-y-6">
        <PageHeader title="Memo Action" subtitle="บทบาทร้านค้าไม่สามารถอนุมัติ Memo ได้" />
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <p className="text-sm text-slate-600">กรุณาใช้งานหน้า PO / งานจัดส่ง หรือหน้าตรวจรับสินค้าแทน</p>
        </div>
      </div>
    );
  }

  return <MemoApprovalPage memoId={params.memoId} />;
}
