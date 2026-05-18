"use client";

import { useParams } from "next/navigation";
import { MemoEditorPage } from "@/components/memo/MemoEditorPage";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProcurementStore } from "@/store/useProcurementStore";

export default function EditMemoPage() {
  const params = useParams<{ memoId: string }>();
  const currentRole = useProcurementStore((state) => state.currentRole);

  if (currentRole === "Vendor") {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Memo" subtitle="บทบาทร้านค้าไม่สามารถแก้ไข Memo ได้" />
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <p className="text-sm text-slate-600">กรุณาใช้งานหน้า PO / งานจัดส่ง หรือหน้าตรวจรับสินค้าแทน</p>
        </div>
      </div>
    );
  }

  return <MemoEditorPage memoId={params.memoId} />;
}
