"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { useProcurementStore } from "@/store/useProcurementStore";
import {
  deliveredVendorStatus,
  mergePurchaseOrderWithVendorDelivery,
  vendorDeliveryStatuses,
} from "@/lib/vendor-delivery";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

export function VendorDeliveryActionPage({ poId }: { poId: string }) {
  const router = useRouter();
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const vendorDeliveries = useProcurementStore((state) => state.vendorDeliveries);
  const memos = useProcurementStore((state) => state.memos);
  const users = useProcurementStore((state) => state.users);
  const updateVendorDelivery = useProcurementStore((state) => state.updateVendorDelivery);

  const purchaseOrder = useMemo(() => {
    const rawPo = purchaseOrders.find((item) => item.id === poId);
    return rawPo ? mergePurchaseOrderWithVendorDelivery(rawPo, vendorDeliveries) : null;
  }, [poId, purchaseOrders, vendorDeliveries]);
  const sourceMemo = useMemo(
    () => (purchaseOrder ? memos.find((memo) => memo.id === purchaseOrder.memoId) ?? null : null),
    [memos, purchaseOrder],
  );
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;

  const [status, setStatus] = useState(
    purchaseOrder?.vendorDeliveryStatus ?? vendorDeliveryStatuses[0],
  );
  const [trackingNumber, setTrackingNumber] = useState(purchaseOrder?.trackingNumber ?? "");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    purchaseOrder?.expectedDeliveryDate ?? "",
  );
  const [note, setNote] = useState(purchaseOrder?.vendorDeliveryNote ?? "");
  const [successOpen, setSuccessOpen] = useState(false);

  const canAccess = currentRole === "Vendor" && Boolean(purchaseOrder?.selectedVendorName);

  const handleSave = () => {
    if (!purchaseOrder) {
      return;
    }

    const now = new Date().toISOString();
    updateVendorDelivery(purchaseOrder.id, {
      vendorDeliveryStatus: status,
      vendorDeliveryNote: note.trim() || undefined,
      trackingNumber: trackingNumber.trim() || undefined,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      deliveredAt: status === deliveredVendorStatus ? now : purchaseOrder.deliveredAt,
      vendorUpdatedAt: now,
      vendorName: currentUser?.name ?? purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName,
    });
    setSuccessOpen(true);
  };

  if (!canAccess || !purchaseOrder) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="อัปเดตสถานะการจัดส่ง"
          subtitle="ไม่สามารถเข้าถึงรายการ PO นี้ได้"
        />
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <p className="text-sm text-slate-600">
            หน้านี้สำหรับบทบาทร้านค้าและเฉพาะ PO ที่มีการยืนยัน Vendor แล้วเท่านั้น
          </p>
          <button
            type="button"
            onClick={() => router.push("/my-requests?tab=po")}
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37]"
          >
            กลับไปหน้า PO / งานจัดส่ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="อัปเดตสถานะการจัดส่ง"
        subtitle="ร้านค้าสามารถอัปเดตความคืบหน้าการจัดส่งให้ผู้อนุมัติและฝ่ายจัดซื้อเห็นได้ทันที"
        badge="งานจัดส่ง"
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Purchase Order</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {purchaseOrder.poNumber ?? purchaseOrder.documentNumber}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Vendor: {purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName}
              </p>
            </div>
            <StatusBadge
              label={purchaseOrder.vendorDeliveryStatus ?? "PO Created"}
              className="min-h-8 min-w-0 px-3 text-[11px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">PO No</p>
              <p className="mt-2 font-semibold text-slate-900">{purchaseOrder.poNumber ?? "-"}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">PR No</p>
              <p className="mt-2 font-semibold text-slate-900">{purchaseOrder.prNumber ?? purchaseOrder.documentNumber}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">ยอดรวม</p>
              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(purchaseOrder.amount)}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <p className="text-xs text-slate-500">Vendor ที่เลือก</p>
              <p className="mt-2 font-semibold text-slate-900">{purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 xl:col-span-3">
              <p className="text-xs text-slate-500">สถานที่จัดส่ง</p>
              <p className="mt-2 font-semibold text-slate-900">{sourceMemo?.deliveryLocation ?? "-"}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[#f8fbf9] p-5">
            <p className="text-sm font-semibold text-slate-900">รายการสินค้า</p>
            <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[#eef7f1] text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">รายการ</th>
                    <th className="px-4 py-3 text-right font-semibold">จำนวน</th>
                    <th className="px-4 py-3 text-left font-semibold">หน่วย</th>
                    <th className="px-4 py-3 text-right font-semibold">มูลค่า</th>
                  </tr>
                </thead>
                <tbody>
                  {(sourceMemo?.items ?? []).map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{item.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-700">{item.unit}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div>
            <p className="text-sm font-semibold text-slate-900">สถานะการจัดส่ง</p>
            <div className="mt-4 space-y-3">
              {vendorDeliveryStatuses.map((option) => {
                const active = status === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left transition ${
                      active
                        ? "border-[#007946] bg-[#eef8f2] text-[#0d5738]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#007946]/25 hover:bg-[#f7fbf8]"
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    {active ? <span className="rounded-full bg-[#007946] px-2 py-1 text-xs font-semibold text-white">ปัจจุบัน</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Tracking Number</span>
            <input
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="ระบุเลขติดตามพัสดุ (ถ้ามี)"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Expected Delivery Date</span>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(event) => setExpectedDeliveryDate(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">หมายเหตุ</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={5}
              placeholder="ระบุรายละเอียดเพิ่มเติมสำหรับฝ่ายจัดซื้อหรือผู้อนุมัติ"
              className="w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-11 w-full items-center justify-center rounded-[18px] bg-[#007946] px-4 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(0,121,70,0.22)] transition hover:bg-[#005f37]"
          >
            บันทึกสถานะ
          </button>
        </section>
      </div>

      <SuccessModal
        open={successOpen}
        title="อัปเดตสถานะสำเร็จ"
        description="ระบบได้บันทึกสถานะการจัดส่งเรียบร้อยแล้ว ระบบกำลังพากลับไปหน้าระบบจัดซื้อ"
        onClose={() => {
          setSuccessOpen(false);
          router.push(`/my-requests?tab=po&highlightId=${poId}`);
        }}
      />
    </div>
  );
}
