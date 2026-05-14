"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormSection } from "@/components/ui/FormSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { useProcurementStore } from "@/store/useProcurementStore";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

const emptyProposalForm = {
  vendorName: "",
  quotedPrice: "",
  leadTime: "",
  paymentTerms: "",
  notes: "",
  attachmentName: "",
  attachmentUrl: "",
};

const demoVendorProposals = [
  {
    vendorName: "บริษัท สยามแพ็คเกจจิ้ง ซัพพลาย จำกัด",
    quotedPrice: 128500,
    leadTime: "7 วัน",
    paymentTerms: "เครดิต 30 วัน",
    notes: "ผู้ผลิตในประเทศ ส่งของได้ต่อเนื่อง",
  },
  {
    vendorName: "บริษัท ไทยเบฟเวอเรจ แมททีเรียลส์ จำกัด",
    quotedPrice: 131200,
    leadTime: "5 วัน",
    paymentTerms: "เครดิต 45 วัน",
    notes: "มีสต็อกพร้อมส่งและรองรับออเดอร์เร่งด่วน",
  },
  {
    vendorName: "บริษัท กรีนคอนเทนเนอร์ อินดัสทรี จำกัด",
    quotedPrice: 126900,
    leadTime: "10 วัน",
    paymentTerms: "เครดิต 30 วัน",
    notes: "ราคาดี เหมาะกับการสั่งล็อตใหญ่",
  },
  {
    vendorName: "บริษัท ยูไนเต็ดลาเบล แอนด์ บอตเทิล จำกัด",
    quotedPrice: 133750,
    leadTime: "6 วัน",
    paymentTerms: "เครดิต 15 วัน",
    notes: "คุณภาพงานพิมพ์สูงและมีตัวอย่างสินค้าพร้อม",
  },
];

export function VendorProposalActionPage({ poId }: { poId: string }) {
  const router = useRouter();
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const memos = useProcurementStore((state) => state.memos);
  const addVendorProposal = useProcurementStore((state) => state.addVendorProposal);
  const updateVendorProposal = useProcurementStore((state) => state.updateVendorProposal);
  const deleteVendorProposal = useProcurementStore((state) => state.deleteVendorProposal);
  const submitVendorProposals = useProcurementStore((state) => state.submitVendorProposals);
  const approveVendorSelection = useProcurementStore((state) => state.approveVendorSelection);

  const purchaseOrder = useMemo(
    () => purchaseOrders.find((po) => po.id === poId) ?? null,
    [poId, purchaseOrders],
  );
  const sourceMemo = useMemo(
    () => (purchaseOrder ? memos.find((memo) => memo.id === purchaseOrder.memoId) ?? null : null),
    [memos, purchaseOrder],
  );

  const canPurchasingAct = currentRole === "Purchasing" && Boolean(purchaseOrder);
  const canApproverAct =
    currentRole === "Approver" &&
    Boolean(purchaseOrder) &&
    sourceMemo?.assignedApproverId === currentUserId;

  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>(
    () =>
      purchaseOrder?.vendorProposals
        .filter((proposal) => proposal.submittedToApprover)
        .map((proposal) => proposal.id) ?? [],
  );
  const [proposalForm, setProposalForm] = useState(emptyProposalForm);
  const [confirmingProposalId, setConfirmingProposalId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: "",
    description: "",
  });
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const submittedProposals = useMemo(
    () => purchaseOrder?.vendorProposals.filter((proposal) => proposal.submittedToApprover) ?? [],
    [purchaseOrder],
  );

  const resetForm = () => {
    setEditingProposalId(null);
    setProposalForm(emptyProposalForm);
  };

  const handleSaveProposal = async () => {
    if (!purchaseOrder || !proposalForm.vendorName.trim()) return;

    const payload = {
      vendorId: null,
      vendorName: proposalForm.vendorName.trim(),
      quotedPrice: Number(proposalForm.quotedPrice || 0),
      leadTime: proposalForm.leadTime.trim() || "-",
      paymentTerms: proposalForm.paymentTerms.trim() || "-",
      notes: proposalForm.notes.trim() || "-",
      attachmentName: proposalForm.attachmentName.trim() || undefined,
      attachmentUrl: proposalForm.attachmentUrl.trim() || undefined,
      submittedToApprover: false,
    };

    if (editingProposalId) {
      await updateVendorProposal(purchaseOrder.id, editingProposalId, payload);
    } else {
      await addVendorProposal(purchaseOrder.id, payload);
    }

    resetForm();
  };

  const handleAutoFill = async () => {
    if (!purchaseOrder || isAutoFilling) return;

    setIsAutoFilling(true);
    try {
      const existingNames = new Set(
        purchaseOrder.vendorProposals.map((proposal) => proposal.vendorName.trim().toLowerCase()),
      );

      for (const demoProposal of demoVendorProposals) {
        if (existingNames.has(demoProposal.vendorName.toLowerCase())) {
          continue;
        }

        await addVendorProposal(purchaseOrder.id, {
          vendorId: null,
          vendorName: demoProposal.vendorName,
          quotedPrice: demoProposal.quotedPrice,
          leadTime: demoProposal.leadTime,
          paymentTerms: demoProposal.paymentTerms,
          notes: demoProposal.notes,
          attachmentName: undefined,
          attachmentUrl: undefined,
          submittedToApprover: false,
        });
      }

      resetForm();
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleEditProposal = (proposalId: string) => {
    const proposal = purchaseOrder?.vendorProposals.find((item) => item.id === proposalId);
    if (!proposal) return;

    setEditingProposalId(proposal.id);
    setProposalForm({
      vendorName: proposal.vendorName,
      quotedPrice: String(proposal.quotedPrice),
      leadTime: proposal.leadTime,
      paymentTerms: proposal.paymentTerms,
      notes: proposal.notes,
      attachmentName: proposal.attachmentName ?? "",
      attachmentUrl: proposal.attachmentUrl ?? "",
    });
  };

  const toggleSelectedProposal = (proposalId: string) => {
    setSelectedProposalIds((current) =>
      current.includes(proposalId)
        ? current.filter((id) => id !== proposalId)
        : [...current, proposalId],
    );
  };

  const handleConfirmSelected = async () => {
    if (!purchaseOrder || selectedProposalIds.length === 0) return;
    await submitVendorProposals(purchaseOrder.id, selectedProposalIds);
    setIsSubmitConfirmOpen(false);
    setSuccessModal({
      open: true,
      title: "เลือก Vendor สำเร็จ",
      description: "ระบบได้บันทึกรายการ Vendor ที่เลือก และส่งต่อให้หัวหน้าอนุมัติแล้ว",
    });
  };

  const handleApproveVendor = async () => {
    if (!purchaseOrder || !confirmingProposalId) return;
    await approveVendorSelection(purchaseOrder.id, confirmingProposalId, approvalComment);
    setConfirmingProposalId(null);
    setSuccessModal({
      open: true,
      title: "ยืนยัน Vendor สำเร็จ",
      description: "ระบบได้บันทึกการอนุมัติ Vendor แล้ว",
    });
  };

  if (!purchaseOrder || (!canPurchasingAct && !canApproverAct)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ดำเนินการ PR"
          subtitle="ไม่สามารถเข้าถึงหน้าดำเนินการ PR รายการนี้ได้"
        />
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <p className="text-sm text-slate-600">
            หน้านี้สำหรับทีมจัดซื้อเพื่อจัดการ Vendor proposal และสำหรับผู้อนุมัติเพื่อยืนยัน Vendor เท่านั้น
          </p>
          <button
            type="button"
            onClick={() => router.push("/my-requests")}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37]"
          >
            กลับไปหน้า Procure-to-Pay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={canPurchasingAct ? "จัดการ Vendor Proposal" : "อนุมัติการเลือก Vendor"}
        subtitle="จัดการตัวเลือก Vendor แบบเต็มหน้า โดยคงสถานะและข้อมูลเดิมไว้ใน LocalStorage"
      />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <FormSection title="สรุป PR" description="รายละเอียดคำขอที่อยู่ในขั้นตอนคัดเลือก Vendor">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">เลขที่ PR</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {purchaseOrder.prNumber ?? purchaseOrder.documentNumber}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-2">
                  <StatusBadge label={purchaseOrder.procurementStatus} />
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <p className="text-sm text-slate-500">หัวข้อ Memo</p>
                <p className="mt-2 font-semibold text-slate-900">{purchaseOrder.memoTitle}</p>
              </div>
            </div>
          </FormSection>

          {canPurchasingAct ? (
            <FormSection
              title="ฟอร์ม Vendor Proposal"
              description="เพิ่มหรือแก้ไขตัวเลือก Vendor ก่อนส่งให้ผู้อนุมัติ"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={proposalForm.vendorName}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, vendorName: event.target.value }))
                  }
                  placeholder="ชื่อ Vendor"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
                <input
                  type="number"
                  min={0}
                  value={proposalForm.quotedPrice}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, quotedPrice: event.target.value }))
                  }
                  placeholder="ราคาที่เสนอ"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
                <input
                  value={proposalForm.leadTime}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, leadTime: event.target.value }))
                  }
                  placeholder="Lead time"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
                <input
                  value={proposalForm.paymentTerms}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, paymentTerms: event.target.value }))
                  }
                  placeholder="Payment terms"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
                <input
                  value={proposalForm.attachmentName}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, attachmentName: event.target.value }))
                  }
                  placeholder="ชื่อเอกสารแนบ"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
                <input
                  value={proposalForm.attachmentUrl}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, attachmentUrl: event.target.value }))
                  }
                  placeholder="Attachment URL"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
                <textarea
                  value={proposalForm.notes}
                  onChange={(event) =>
                    setProposalForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="หมายเหตุ"
                  rows={3}
                  className="md:col-span-2 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveProposal}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37]"
                >
                  {editingProposalId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingProposalId ? "บันทึกการแก้ไข" : "เพิ่ม Proposal"}
                </button>
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isAutoFilling}
                  className="inline-flex h-10 items-center rounded-xl border border-[#007946]/20 bg-[#f0f9f6] px-4 text-sm font-semibold text-[#007946] transition hover:bg-[#e6f5ee] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAutoFilling ? "กำลังเพิ่มข้อมูล..." : "กรอกข้อมูลอัตโนมัติ"}
                </button>
                {editingProposalId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                ) : null}
              </div>
            </FormSection>
          ) : null}

          <FormSection
            title={canPurchasingAct ? "ตัวเลือก Vendor" : "Vendor ที่ส่งให้อนุมัติ"}
            description={
              canPurchasingAct
                ? "เลือก Vendor ที่ต้องการส่งต่อ แล้วกดยืนยันเพื่อส่งให้ผู้อนุมัติ"
                : "ผู้อนุมัติจะเห็นเฉพาะ Vendor ที่ฝ่ายจัดซื้อส่งมา"
            }
          >
            <div className="space-y-4">
              {(canPurchasingAct ? purchaseOrder.vendorProposals : submittedProposals).length === 0 ? (
                <p className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {canPurchasingAct ? "ยังไม่มี Vendor proposal" : "ยังไม่มี Vendor ที่ส่งมาเพื่ออนุมัติ"}
                </p>
              ) : (
                (canPurchasingAct ? purchaseOrder.vendorProposals : submittedProposals).map((proposal) => (
                  <div key={proposal.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        {canPurchasingAct ? (
                          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedProposalIds.includes(proposal.id)}
                              onChange={() => toggleSelectedProposal(proposal.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#007946]"
                            />
                            ส่ง Vendor นี้ให้ผู้อนุมัติ
                          </label>
                        ) : null}
                        <p className="mt-3 text-lg font-semibold text-slate-900">{proposal.vendorName}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Lead time: {proposal.leadTime} • Payment terms: {proposal.paymentTerms}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{proposal.notes}</p>
                        {proposal.attachmentName ? (
                          <p className="mt-2 text-sm text-sky-700">
                            เอกสารแนบ: {proposal.attachmentName}
                            {proposal.attachmentUrl ? ` (${proposal.attachmentUrl})` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <p className="text-xl font-semibold text-slate-900">
                          {formatCurrency(proposal.quotedPrice)}
                        </p>
                        {canPurchasingAct ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProposal(proposal.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946]"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void deleteVendorProposal(purchaseOrder.id, proposal.id);
                                setSelectedProposalIds((current) =>
                                  current.filter((id) => id !== proposal.id),
                                );
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : purchaseOrder.procurementStatus === "Pending Vendor Approval" ? (
                          <button
                            type="button"
                            onClick={() => setConfirmingProposalId(proposal.id)}
                            className="inline-flex h-10 items-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37]"
                          >
                            ยืนยัน Vendor
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">สรุปการคัดเลือก</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ส่งให้ผู้อนุมัติแล้ว</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{submittedProposals.length}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">ตัวเลือกทั้งหมด</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {purchaseOrder.vendorProposals.length}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status ปัจจุบัน</p>
                <div className="mt-2">
                  <StatusBadge label={purchaseOrder.procurementStatus} />
                </div>
              </div>
            </div>
          </div>

          {canPurchasingAct ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">ส่งให้ผู้อนุมัติ</h2>
              <p className="mt-2 text-sm text-slate-500">
                เลือก Vendor ที่ต้องการส่งต่อ แล้วกดยืนยันเพื่อเปลี่ยนสถานะเป็น Pending Vendor Approval
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitConfirmOpen(true)}
                disabled={selectedProposalIds.length === 0}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                ยืนยัน Vendor ที่เลือก
              </button>
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">หมายเหตุการอนุมัติ</h2>
              <textarea
                value={approvalComment}
                onChange={(event) => setApprovalComment(event.target.value)}
                rows={5}
                placeholder="ระบุหมายเหตุประกอบการยืนยัน Vendor"
                className="mt-4 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </div>
          )}

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">ประวัติรายการ</h2>
            <div className="mt-4 space-y-3">
              {purchaseOrder.history.slice().reverse().map((entry, index) => (
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
        open={isSubmitConfirmOpen}
        title="ยืนยันส่งให้หัวหน้าอนุมัติ?"
        confirmLabel="ส่งอนุมัติ"
        cancelLabel="ยกเลิก"
        onCancel={() => setIsSubmitConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmSelected();
        }}
      />
      <ConfirmModal
        open={Boolean(confirmingProposalId)}
        title="ยืนยันการเลือก Vendor?"
        description="กรุณาตรวจสอบข้อมูล Vendor ก่อนยืนยัน เมื่อยืนยันแล้วระบบจะดำเนินการต่อไปยังขั้นตอน PO"
        cancelLabel="ยกเลิก"
        confirmLabel="ยืนยัน Vendor"
        onCancel={() => setConfirmingProposalId(null)}
        onConfirm={() => {
          void handleApproveVendor();
        }}
      />
      <SuccessModal
        open={successModal.open}
        title={successModal.title}
        description={successModal.description}
        buttonLabel="ไปที่ My Requests"
        onClose={() => {
          setSuccessModal({ open: false, title: "", description: "" });
          router.push("/my-requests");
        }}
      />
    </div>
  );
}
