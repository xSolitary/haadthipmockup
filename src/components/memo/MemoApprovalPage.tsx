"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormSection } from "@/components/ui/FormSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { getCategoryLabel, getUrgencyLabel } from "@/lib/ui-text";
import { useProcurementStore } from "@/store/useProcurementStore";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);

type SuccessModalState = {
  open: boolean;
  title: string;
  description: ReactNode;
  variant: "success" | "warning";
};

const defaultSuccessModalState: SuccessModalState = {
  open: false,
  title: "",
  description: null,
  variant: "success",
};

export function MemoApprovalPage({ memoId }: { memoId: string }) {
  const router = useRouter();
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const memos = useProcurementStore((state) => state.memos);
  const approveMemo = useProcurementStore((state) => state.approveMemo);
  const requestRevision = useProcurementStore((state) => state.requestRevision);

  const memo = useMemo(() => memos.find((item) => item.id === memoId) ?? null, [memoId, memos]);
  const [comment, setComment] = useState("");
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [successModal, setSuccessModal] = useState<SuccessModalState>(defaultSuccessModalState);
  const [isCompletingAction, setIsCompletingAction] = useState(false);

  const canAct = memo && memo.status === "Pending Approval" && memo.assignedApproverId === currentUserId;
  const shouldShowActionPage = Boolean(memo) && (canAct || successModal.open || isCompletingAction);

  useEffect(() => {
    if (!memo || (!canAct && !successModal.open && !isCompletingAction)) {
      router.replace("/my-requests?tab=memo");
    }
  }, [canAct, isCompletingAction, memo, router, successModal.open]);

  const closeResultModal = () => {
    setIsCompletingAction(false);
    setSuccessModal(defaultSuccessModalState);
    router.push(`/my-requests?tab=memo&highlightId=${memoId}`);
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!memo) return;

    const trimmedComment = comment.trim();
    setIsCompletingAction(true);

    if (action === "approve") {
      await approveMemo(memo.id, comment);
      setSuccessModal({
        open: true,
        title: "อนุมัติ Memo สำเร็จ",
        description: (
          <div className="space-y-2 text-center">
            <p>ระบบได้บันทึกการอนุมัติ Memo เรียบร้อยแล้ว</p>
            <p>ระบบกำลังพากลับไปหน้าระบบจัดซื้อ</p>
          </div>
        ),
        variant: "success",
      });
      return;
    }

    await requestRevision(memo.id, comment);
    setSuccessModal({
      open: true,
      title: "ปฏิเสธ Memo สำเร็จ",
      description: (
        <div className="space-y-2 text-center">
          <p>ระบบได้ส่ง Memo กลับไปให้ผู้ขอซื้อแก้ไขแล้ว</p>
          {trimmedComment ? <p className="font-medium text-slate-700">เหตุผล: {trimmedComment}</p> : null}
          <p>ระบบกำลังพากลับไปหน้าระบบจัดซื้อ</p>
        </div>
      ),
      variant: "warning",
    });
  };

  const openConfirm = (action: "approve" | "reject") => {
    if (action === "reject" && !comment.trim()) return;
    setConfirmAction(action);
  };

  if (!shouldShowActionPage) {
    return null;
  }

  const activeMemo = memo!;

  return (
    <div className="space-y-6">
      <PageHeader title="อนุมัติ Memo" subtitle="ตรวจสอบข้อมูล Memo แบบเต็มหน้าและตัดสินใจอนุมัติได้ทันที" />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <FormSection
            title="ข้อมูลผู้ขอซื้อ"
            description="รายละเอียดผู้ขอซื้อและหน่วยงานที่เกี่ยวข้อง"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                ชื่อผู้ขอซื้อ
                <input
                  readOnly
                  value={activeMemo.requesterName}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                ฝ่ายงาน
                <input
                  readOnly
                  value={activeMemo.department}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                ไซต์ / โรงงาน
                <input
                  readOnly
                  value={activeMemo.site}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Cost Center
                <input
                  readOnly
                  value={activeMemo.costCenter}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                วันที่ขอ
                <input
                  readOnly
                  value={activeMemo.requestDate}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                วันที่ต้องการใช้
                <input
                  readOnly
                  value={activeMemo.requiredDate}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
            </div>
          </FormSection>

          <FormSection title="รายละเอียดคำขอ" description="ข้อมูลคำขอที่ส่งมาเพื่อรอการอนุมัติ">
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-slate-700">
                หัวข้อ Memo
                <input
                  readOnly
                  value={activeMemo.title}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  หมวดจัดซื้อ
                  <input
                    readOnly
                    value={getCategoryLabel(activeMemo.category)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  ความเร่งด่วน
                  <input
                    readOnly
                    value={getUrgencyLabel(activeMemo.urgency)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-700">
                วัตถุประสงค์ / เหตุผล
                <textarea
                  readOnly
                  value={activeMemo.purpose}
                  rows={4}
                  className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  รหัส Budget
                  <input
                    readOnly
                    value={activeMemo.budgetCode}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  สถานที่จัดส่ง
                  <input
                    readOnly
                    value={activeMemo.deliveryLocation}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection title="รายการสินค้า / บริการ" description="รายการที่ระบุใน Memo ฉบับนี้">
            <div className="space-y-4">
              {activeMemo.items.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                    <div>
                      <p className="text-sm text-slate-500">ชื่อรายการ</p>
                      <p className="mt-2 font-semibold text-slate-900">{item.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">จำนวน</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {item.quantity.toLocaleString()} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">ราคา / หน่วย</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(item.unitPrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">สรุปคำขอ</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">เลขที่เอกสาร</p>
                <p className="mt-2 font-semibold text-slate-900">{activeMemo.documentNumber}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-2">
                  <StatusBadge label={activeMemo.status} />
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">มูลค่ารวมประมาณการ</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(activeMemo.estimatedTotal)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">คำตัดสินอนุมัติ</h2>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={5}
              placeholder="ระบุหมายเหตุประกอบการพิจารณา"
              className="mt-4 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
            <p className="mt-3 text-sm text-slate-500">
              ปฏิเสธจะถูกบันทึกเป็นสถานะขอแก้ไข และต้องระบุเหตุผลทุกครั้ง
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => openConfirm("approve")}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#00663b]"
              >
                <CheckCircle2 className="h-4 w-4" /> อนุมัติ
              </button>
              <button
                type="button"
                onClick={() => openConfirm("reject")}
                disabled={!comment.trim()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                <XCircle className="h-4 w-4" /> ปฏิเสธ
              </button>
            </div>
            {!comment.trim() ? <p className="mt-3 text-sm text-rose-600">กรุณาระบุเหตุผลก่อนกดปฏิเสธ</p> : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">ประวัติรายการ</h2>
            <div className="mt-4 space-y-3">
              {activeMemo.history.slice().reverse().map((entry, index) => (
                <div
                  key={`${entry.id}-${entry.date}-${entry.action}-${entry.actorId}-${index}`}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{entry.actionLabelTh}</p>
                    <span className="text-xs text-slate-400">{entry.date.slice(0, 10)}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{entry.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {entry.actorName} • {entry.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={confirmAction === "approve"}
        title="ยืนยันอนุมัติ Memo?"
        confirmLabel="อนุมัติ"
        cancelLabel="ยกเลิก"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          void handleAction("approve");
        }}
      />
      <ConfirmModal
        open={confirmAction === "reject"}
        confirmVariant="danger"
        title="ยืนยันปฏิเสธ Memo?"
        description="เหตุผลนี้จะถูกบันทึกในประวัติ Memo และแสดงให้ผู้ขอซื้อเห็น"
        confirmLabel="ปฏิเสธ"
        cancelLabel="ยกเลิก"
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          void handleAction("reject");
        }}
      />
      <SuccessModal
        open={successModal.open}
        title={successModal.title}
        description={successModal.description}
        variant={successModal.variant}
        onClose={closeResultModal}
      />
    </div>
  );
}
