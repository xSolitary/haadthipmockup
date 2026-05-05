"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useProcurementStore } from "@/store/useProcurementStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { departments, sites } from "@/lib/mock-data";
import type { ProcurementCategory } from "@/lib/types";

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

export default function CreateMemoPage() {
  const router = useRouter();
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const currentUser = useProcurementStore((state) => state.users.find((user) => user.id === currentUserId));
  const createMemo = useProcurementStore((state) => state.createMemo);
  const submitMemo = useProcurementStore((state) => state.submitMemo);
  const memoCount = useProcurementStore((state) => state.memos.length);

  const [title, setTitle] = useState("ขวด PET และฉลากสินค้าใหม่สำหรับไลน์ผลิต");
  const [category, setCategory] = useState<ProcurementCategory>("Packaging");
  const [purpose, setPurpose] = useState("รองรับการบรรจุเครื่องดื่มสูตรใหม่และสต็อกฉลากสินค้า");
  const [urgency, setUrgency] = useState<typeof urgencyOptions[number]>("Normal");
  const [budgetCode, setBudgetCode] = useState("BUD-3308");
  const [deliveryLocation, setDeliveryLocation] = useState("โรงงานหาดใหญ่");
  const [department, setDepartment] = useState(departments[0]);
  const [site, setSite] = useState(sites[1]);
  const [costCenter, setCostCenter] = useState("CC-1201");
  const [requiredDate, setRequiredDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [items, setItems] = useState([
    { id: "item-1", name: "ขวด PET 330 มล.", quantity: 8000, unit: "ชิ้น", unitPrice: 3.4, category: "Packaging" as ProcurementCategory },
    { id: "item-2", name: "ฉลากสินค้าเต็มสี", quantity: 8000, unit: "แผ่น", unitPrice: 0.95, category: "Packaging" as ProcurementCategory },
  ]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items],
  );

  const handleItemChange = (id: string, field: string, value: string | number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "quantity" || field === "unitPrice" ? Number(value) : value,
            }
          : item,
      ),
    );
  };

  const addRow = () => {
    setItems((current) => [
      ...current,
      { id: `item-${current.length + 1}`, name: "", quantity: 1, unit: "ชิ้น", unitPrice: 0, category: "Packaging" as ProcurementCategory },
    ]);
  };

  const removeRow = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleSaveDraft = () => {
    createMemo({
      title,
      category,
      purpose,
      urgency,
      budgetCode,
      deliveryLocation,
      department,
      site,
      costCenter,
      requestDate: new Date().toISOString().slice(0, 10),
      requiredDate,
      items,
      attachments: ["ใบเสนอราคา.pdf", "ภาพตัวอย่างสินค้า.png"],
      budgetRemaining: 380000,
      requesterId: currentUserId,
      requesterName: currentUser?.name ?? "ผู้ขอ",
    });
    router.push("/my-requests");
  };

  const handleSubmit = () => {
    const nextMemoId = `memo-${memoCount + 1}`;
    createMemo({
      title,
      category,
      purpose,
      urgency,
      budgetCode,
      deliveryLocation,
      department,
      site,
      costCenter,
      requestDate: new Date().toISOString().slice(0, 10),
      requiredDate,
      items,
      attachments: ["ใบเสนอราคา.pdf", "ภาพตัวอย่างสินค้า.png"],
      budgetRemaining: 380000,
      requesterId: currentUserId,
      requesterName: currentUser?.name ?? "ผู้ขอ",
    });
    submitMemo(nextMemoId);
    router.push("/approvals");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="สร้าง Memo ขอซื้อ" subtitle="แบบฟอร์มคำขอจัดซื้อสำหรับฝ่ายองค์กร" />
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <FormSection title="ข้อมูลผู้ขอ" description="ตรวจสอบและกรอกข้อมูลของผู้ขอให้ครบถ้วน">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                ชื่อผู้ขอ
                <input type="text" value={currentUser?.name ?? ""} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                ฝ่ายงาน
                <select value={department} onChange={(event) => setDepartment(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {departments.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                ไซต์ / โรงงาน
                <select value={site} onChange={(event) => setSite(event.target.value as typeof site)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                  {sites.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                Cost Center
                <input value={costCenter} onChange={(event) => setCostCenter(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                วันที่ขอ
                <input type="date" value={new Date().toISOString().slice(0, 10)} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                วันที่ต้องการ
                <input type="date" value={requiredDate} onChange={(event) => setRequiredDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
              </label>
            </div>
          </FormSection>
          <FormSection title="รายละเอียดคำขอ" description="กรอกข้อมูลรายละเอียดและเหตุผลของคำขอจัดซื้อ">
            <div className="space-y-4">
              <label className="space-y-2 text-sm text-slate-700">
                หัวข้อ Memo
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  หมวดการจัดซื้อ
                  <select value={category} onChange={(event) => setCategory(event.target.value as ProcurementCategory)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                    {categories.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  ความเร่งด่วน
                  <select value={urgency} onChange={(event) => setUrgency(event.target.value as typeof urgencyOptions[number])} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                    {urgencyOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-700">
                วัตถุประสงค์ / เหตุผล
                <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={4} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"></textarea>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  รหัสงบประมาณ
                  <input value={budgetCode} onChange={(event) => setBudgetCode(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  สถานที่จัดส่ง
                  <input value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                </label>
              </div>
            </div>
          </FormSection>
          <FormSection title="รายการสินค้า / บริการ" description="เพิ่มสินค้าและประมาณราคาเพื่อประกอบคำขอ">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                    <label className="space-y-2 text-sm text-slate-700">
                      ชื่อสินค้า
                      <input value={item.name} onChange={(event) => handleItemChange(item.id, "name", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      จำนวน
                      <input type="number" min={1} value={item.quantity} onChange={(event) => handleItemChange(item.id, "quantity", Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      ราคา/หน่วย
                      <input type="number" min={0} value={item.unitPrice} onChange={(event) => handleItemChange(item.id, "unitPrice", Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr_0.6fr] items-end">
                    <label className="space-y-2 text-sm text-slate-700">
                      หน่วย
                      <input value={item.unit} onChange={(event) => handleItemChange(item.id, "unit", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      หมวดหมู่
                      <select value={item.category} onChange={(event) => handleItemChange(item.id, "category", event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
                        {categories.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => removeRow(item.id)} className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-rose-50 text-rose-700 transition hover:bg-rose-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRow} className="inline-flex items-center gap-2 rounded-2xl bg-[#007946] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#005f37]">
                <Plus className="h-4 w-4" /> เพิ่มรายการ
              </button>
            </div>
          </FormSection>
          <FormSection title="เอกสารแนบ" description="แนบไฟล์ที่เกี่ยวข้องกับคำขอ เช่น ใบเสนอราคา หรือเอกสารประกอบ">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
              <p className="text-sm">ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
              <p className="mt-2 text-xs">*ระบบนี้เป็นโหมดสาธิต ไม่มีการอัปโหลดจริง</p>
            </div>
            <div className="grid gap-2 rounded-3xl bg-slate-100 p-4 text-sm text-slate-600">
              <div>ใบเสนอราคา.pdf</div>
              <div>ภาพตัวอย่างสินค้า.png</div>
            </div>
          </FormSection>
        </div>
        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">สรุปคำขอ</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-slate-500">ยอดรวมประมาณการ</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(total)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-slate-500">สถานะปัจจุบัน</p>
                <div className="mt-2"><StatusBadge label="Draft" /></div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-slate-500">ผู้อนุมัติ</p>
                <p className="mt-2 font-semibold text-slate-900">นางสาวปัทมา วัฒนสุข</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-slate-500">เงินงบประมาณคงเหลือ</p>
                <p className="mt-2 font-semibold text-slate-900">THB 380,000</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">การตรวจสอบระบบ</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">Inventory stock check: OK</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">Budget validation: Approved</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">Vendor hint: Vendor master ready</div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <div className="space-y-3">
              <button type="button" onClick={handleSubmit} className="w-full rounded-2xl bg-[#007946] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#005f37]">
                Submit for Approval
              </button>
              <button type="button" onClick={handleSaveDraft} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Save Draft
              </button>
              <button type="button" onClick={() => router.push("/")} className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
