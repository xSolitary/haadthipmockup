"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormSection } from "@/components/ui/FormSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { departments, sites } from "@/lib/mock-data";
import { PROCUREMENT_LIMITS } from "@/lib/procurement-validation";
import type { MemoItem, MemoRequest, ProcurementCategory } from "@/lib/types";
import { getCategoryLabel, getUrgencyLabel } from "@/lib/ui-text";
import { useProcurementStore } from "@/store/useProcurementStore";

const categories: ProcurementCategory[] = [
  "Raw Material",
  "Packaging",
  "Spare Parts",
  "Factory Supplies",
  "Marketing / POSM",
  "Fleet / Vehicle",
  "IT / Office",
  "Service / Contractor",
];

const urgencyOptions = ["Normal", "Urgent", "Emergency"] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);

type EditorSuccessModalState = {
  open: boolean;
  title: string;
  description: ReactNode;
  redirectId?: string;
};

const defaultSuccessModalState: EditorSuccessModalState = {
  open: false,
  title: "",
  description: "",
  redirectId: undefined,
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function createBlankItem(index: number): MemoItem {
  return {
    id: `item-${index}`,
    name: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    category: "Packaging",
  };
}

function getDemoMemoValues() {
  return {
    title: "ขวด PET และฉลากสินค้าสำหรับไลน์ผลิตใหม่",
    category: "Packaging" as ProcurementCategory,
    purpose: "รองรับการบรรจุเครื่องดื่มสูตรใหม่และเตรียมสต็อกฉลากสินค้า",
    urgency: "Normal" as (typeof urgencyOptions)[number],
    budgetCode: "BUD-3308",
    deliveryLocation: "โรงงานหาดใหญ่",
    costCenter: "CC-1201",
    requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    items: [
      {
        id: "item-1",
        name: "ขวด PET 330 มล.",
        quantity: 8000,
        unit: "ชิ้น",
        unitPrice: 3.4,
        category: "Packaging" as ProcurementCategory,
      },
      {
        id: "item-2",
        name: "ฉลากสินค้าเต็มสี",
        quantity: 8000,
        unit: "แผ่น",
        unitPrice: 0.95,
        category: "Packaging" as ProcurementCategory,
      },
    ],
  };
}

function getBlankMemoValues(currentUser: { department: string; site: MemoRequest["site"] } | null) {
  return {
    title: "",
    category: "Packaging" as ProcurementCategory,
    purpose: "",
    urgency: "Normal" as (typeof urgencyOptions)[number],
    budgetCode: "",
    deliveryLocation: "",
    department: currentUser?.department ?? departments[0],
    site: currentUser?.site ?? sites[0],
    costCenter: "",
    requiredDate: "",
    items: [createBlankItem(1)],
  };
}

function getMemoValues(
  memo: MemoRequest | null,
  currentUser: { department: string; site: MemoRequest["site"] } | null,
) {
  if (!memo) return getBlankMemoValues(currentUser);

  return {
    title: memo.title,
    category: memo.category,
    purpose: memo.purpose,
    urgency: memo.urgency,
    budgetCode: memo.budgetCode,
    deliveryLocation: memo.deliveryLocation,
    department: memo.department,
    site: memo.site,
    costCenter: memo.costCenter,
    requiredDate: memo.requiredDate,
    items: memo.items,
  };
}

export function MemoEditorPage({ memoId }: { memoId?: string }) {
  const router = useRouter();
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const currentUser = useProcurementStore((state) => state.users.find((user) => user.id === currentUserId) ?? null);
  const memos = useProcurementStore((state) => state.memos);
  const createMemo = useProcurementStore((state) => state.createMemo);
  const updateMemo = useProcurementStore((state) => state.updateMemo);
  const submitMemo = useProcurementStore((state) => state.submitMemo);
  const resubmitMemo = useProcurementStore((state) => state.resubmitMemo);

  const editingMemo = useMemo(() => (memoId ? memos.find((memo) => memo.id === memoId) ?? null : null), [memoId, memos]);
  const isEditing = Boolean(memoId);
  const canEdit =
    !isEditing ||
    Boolean(
      editingMemo &&
        editingMemo.requesterId === currentUserId &&
        (editingMemo.status === "Draft" || editingMemo.status === "Revision Required"),
    );

  const initialValues = getMemoValues(editingMemo, currentUser);
  const [title, setTitle] = useState(initialValues.title);
  const [category, setCategory] = useState<ProcurementCategory>(initialValues.category);
  const [purpose, setPurpose] = useState(initialValues.purpose);
  const [urgency, setUrgency] = useState<(typeof urgencyOptions)[number]>(initialValues.urgency);
  const [budgetCode, setBudgetCode] = useState(initialValues.budgetCode);
  const [deliveryLocation, setDeliveryLocation] = useState(initialValues.deliveryLocation);
  const [department, setDepartment] = useState(initialValues.department);
  const [site, setSite] = useState(initialValues.site);
  const [costCenter, setCostCenter] = useState(initialValues.costCenter);
  const [requiredDate, setRequiredDate] = useState(initialValues.requiredDate);
  const [items, setItems] = useState(initialValues.items);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
  const [successModal, setSuccessModal] = useState<EditorSuccessModalState>(defaultSuccessModalState);
  const [isCompletingResubmit, setIsCompletingResubmit] = useState(false);

  const shouldShowEditor = !isEditing || Boolean(editingMemo) && (canEdit || successModal.open || isCompletingResubmit);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);

  const latestRevisionReason = editingMemo?.history
    .slice()
    .reverse()
    .find((entry) => entry.action === "Revision Required" || entry.action === "Rejected")?.comment;

  useEffect(() => {
    if (isEditing && (!editingMemo || (!canEdit && !successModal.open && !isCompletingResubmit))) {
      router.replace("/my-requests?tab=memo");
    }
  }, [canEdit, editingMemo, isCompletingResubmit, isEditing, router, successModal.open]);

  const handleItemChange = (id: string, field: keyof MemoItem, value: string | number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity"
                  ? clampNumber(Number(value), 1, PROCUREMENT_LIMITS.itemQuantityMax)
                  : field === "unitPrice"
                    ? clampNumber(Number(value), 0, PROCUREMENT_LIMITS.unitPriceMax)
                    : value,
            }
          : item,
      ),
    );
  };

  const addRow = () => {
    setItems((current) => [...current, createBlankItem(current.length + 1)]);
  };

  const removeRow = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const fillDemoData = () => {
    const demo = getDemoMemoValues();
    setTitle(demo.title);
    setCategory(demo.category);
    setPurpose(demo.purpose);
    setUrgency(demo.urgency);
    setBudgetCode(demo.budgetCode);
    setDeliveryLocation(demo.deliveryLocation);
    setCostCenter(demo.costCenter);
    setRequiredDate(demo.requiredDate);
    setItems(demo.items);
  };

  const payload = {
    title,
    category,
    purpose,
    urgency,
    budgetCode,
    deliveryLocation,
    department,
    site,
    costCenter,
    requestDate: editingMemo?.requestDate ?? new Date().toISOString().slice(0, 10),
    requiredDate,
    items,
    attachments: editingMemo?.attachments ?? ["ใบเสนอราคา.pdf", "ภาพตัวอย่างสินค้า.png"],
    budgetRemaining: editingMemo?.budgetRemaining ?? 380000,
    requesterId: currentUserId,
    requesterName: currentUser?.name ?? "ผู้ขอซื้อ",
  };

  const handleSaveDraft = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingMemo) {
        await updateMemo(editingMemo.id, payload);
        router.push(`/my-requests?tab=memo&highlightId=${editingMemo.id}`);
      } else {
        const createdMemoId = await createMemo(payload);
        router.push(`/my-requests?tab=memo&highlightId=${createdMemoId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingMemo) {
        if (editingMemo.status === "Revision Required") {
          setIsCompletingResubmit(true);
          await resubmitMemo(editingMemo.id, payload);
          setSuccessModal({
            open: true,
            title: "ส่ง Memo กลับไปอนุมัติสำเร็จ",
            description: (
              <div className="space-y-2 text-center">
                <p>ระบบได้ส่ง Memo ให้หัวหน้าพิจารณาอีกครั้งแล้ว</p>
                <p>ระบบกำลังพากลับไปหน้าระบบจัดซื้อ</p>
              </div>
            ),
            redirectId: editingMemo.id,
          });
        } else {
          await updateMemo(editingMemo.id, payload);
          await submitMemo(editingMemo.id);
          router.push(`/my-requests?tab=memo&highlightId=${editingMemo.id}`);
        }
      } else {
        const createdMemoId = await createMemo(payload);
        await submitMemo(createdMemoId);
        setSuccessModal({
          open: true,
          title: "สร้าง Memo สำเร็จ",
          description: (
            <div className="space-y-2 text-center">
              <p>ระบบได้สร้างและส่ง Memo เข้าสู่ขั้นตอนอนุมัติเรียบร้อยแล้ว</p>
              <p>ระบบกำลังพากลับไปหน้าระบบจัดซื้อ</p>
            </div>
          ),
          redirectId: createdMemoId,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (isEditing) {
      void handleSubmit();
      return;
    }

    setIsCreateConfirmOpen(true);
  };

  if (!shouldShowEditor) {
    return null;
  }

  const isRevision = editingMemo?.status === "Revision Required";
  const statusLabel = editingMemo?.status ?? "Draft";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? (isRevision ? "แก้ไข Memo เพื่อส่งใหม่" : "แก้ไข Memo Draft") : "Create Memo"}
        subtitle={isEditing ? "ปรับปรุงข้อมูลคำขอเดิมโดยคง Workflow เดิมของระบบ" : "สร้างคำขอจัดซื้อใหม่"}
      />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {isRevision && latestRevisionReason ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <p className="font-semibold">เหตุผลที่ถูกปฏิเสธ: {latestRevisionReason}</p>
            </div>
          ) : null}

          <FormSection title="ข้อมูลผู้ขอซื้อ" description="ตรวจสอบและกรอกข้อมูลผู้ขอซื้อให้ครบถ้วน">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                ชื่อผู้ขอซื้อ
                <input
                  type="text"
                  value={currentUser?.name ?? ""}
                  readOnly
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                ฝ่ายงาน
                <select
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                >
                  {departments.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                ไซต์ / โรงงาน
                <select
                  value={site}
                  onChange={(event) => setSite(event.target.value as typeof site)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                >
                  {sites.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Cost Center
                <input
                  value={costCenter}
                  onChange={(event) => setCostCenter(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                วันที่ขอ
                <input
                  type="date"
                  value={editingMemo?.requestDate ?? new Date().toISOString().slice(0, 10)}
                  readOnly
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                วันที่ต้องการใช้
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(event) => setRequiredDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
            </div>
          </FormSection>

          <FormSection title="รายละเอียดคำขอ" description="กรอกข้อมูลรายละเอียดและเหตุผลของคำขอจัดซื้อ">
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-slate-700">
                หัวข้อ Memo
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  หมวดจัดซื้อ
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ProcurementCategory)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  >
                    {categories.map((option) => (
                      <option key={option} value={option}>
                        {getCategoryLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  ความเร่งด่วน
                  <select
                    value={urgency}
                    onChange={(event) => setUrgency(event.target.value as (typeof urgencyOptions)[number])}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  >
                    {urgencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {getUrgencyLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-700">
                วัตถุประสงค์ / เหตุผล
                <textarea
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  rows={4}
                  className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  รหัส Budget
                  <input
                    value={budgetCode}
                    onChange={(event) => setBudgetCode(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  สถานที่จัดส่ง
                  <input
                    value={deliveryLocation}
                    onChange={(event) => setDeliveryLocation(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                  />
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection title="รายการสินค้า / บริการ" description="เพิ่มรายการและประมาณการราคาเพื่อประกอบคำขอ">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                    <label className="space-y-2 text-sm text-slate-700">
                      ชื่อรายการ
                      <input
                        value={item.name}
                        onChange={(event) => handleItemChange(item.id, "name", event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      จำนวน
                      <input
                        type="number"
                        min={1}
                        max={PROCUREMENT_LIMITS.itemQuantityMax}
                        value={item.quantity}
                        onChange={(event) => handleItemChange(item.id, "quantity", Number(event.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      ราคา / หน่วย
                      <input
                        type="number"
                        min={0}
                        max={PROCUREMENT_LIMITS.unitPriceMax}
                        value={item.unitPrice}
                        onChange={(event) => handleItemChange(item.id, "unitPrice", Number(event.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                  </div>
                  <div className="mt-4 grid items-end gap-4 md:grid-cols-[1.2fr_1fr_0.6fr]">
                    <label className="space-y-2 text-sm text-slate-700">
                      หน่วย
                      <input
                        value={item.unit}
                        onChange={(event) => handleItemChange(item.id, "unit", event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      หมวดย่อย
                      <select
                        value={item.category}
                        onChange={(event) => handleItemChange(item.id, "category", event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      >
                        {categories.map((option) => (
                          <option key={option} value={option}>
                            {getCategoryLabel(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRow(item.id)}
                      className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addRow}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37]"
              >
                <Plus className="h-4 w-4" /> เพิ่มรายการ
              </button>
            </div>
          </FormSection>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">สรุปคำขอ</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-slate-500">มูลค่ารวมประมาณการ</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(total)}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-slate-500">Status ปัจจุบัน</p>
                <div className="mt-2">
                  <StatusBadge label={statusLabel} />
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-slate-500">ผู้อนุมัติ</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {editingMemo?.currentApproverName ?? "นางสาวปัทมา วัฒนสุข"}
                </p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-slate-500">Budget คงเหลือ</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCurrency(editingMemo?.budgetRemaining ?? 380000)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-900">การตรวจสอบระบบ</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">ตรวจสอบสต็อก Inventory: ผ่าน</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">ตรวจสอบ Budget: ผ่าน</div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">Vendor hint: Vendor master พร้อมใช้งาน</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
            <div className="space-y-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={fillDemoData}
                  disabled={isSubmitting}
                  className="h-10 w-full rounded-xl border border-[#007946]/20 bg-[#f0f9f6] px-4 text-sm font-semibold text-[#007946] transition hover:bg-[#e6f5ee] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  กรอกข้อมูลอัตโนมัติ
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "กำลังประมวลผล..." : isRevision ? "ส่งกลับเพื่ออนุมัติอีกครั้ง" : "ส่งอนุมัติ"}
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "กำลังประมวลผล..." : isEditing ? "บันทึกการเปลี่ยนแปลง" : "บันทึก Draft"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/my-requests?tab=memo")}
                disabled={isSubmitting}
                className="h-10 w-full rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={isCreateConfirmOpen}
        title="ยืนยันสร้าง Memo?"
        description="กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนส่งอนุมัติ"
        confirmLabel="ยืนยันสร้าง Memo"
        cancelLabel="ยกเลิก"
        onCancel={() => setIsCreateConfirmOpen(false)}
        onConfirm={() => {
          setIsCreateConfirmOpen(false);
          void handleSubmit();
        }}
      />
      <SuccessModal
        open={successModal.open}
        title={successModal.title}
        description={successModal.description}
        onClose={() => {
          const redirectId = successModal.redirectId ?? memoId;
          setIsCompletingResubmit(false);
          setSuccessModal(defaultSuccessModalState);
          router.push(redirectId ? `/my-requests?tab=memo&highlightId=${redirectId}` : "/my-requests?tab=memo");
        }}
      />
    </div>
  );
}
