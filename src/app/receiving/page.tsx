"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { useProcurementStore } from "@/store/useProcurementStore";
import {
  formatVendorUpdateTimestamp,
  getVendorTimeline,
  isReceivingEnabled,
  mergePurchaseOrderWithVendorDelivery,
} from "@/lib/vendor-delivery";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);

export default function ReceivingPage() {
  const currentRole = useProcurementStore((state) => state.currentRole);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const vendorDeliveries = useProcurementStore((state) => state.vendorDeliveries);
  const receivingRecords = useProcurementStore((state) => state.receivingRecords);
  const receivePo = useProcurementStore((state) => state.receivePo);
  const markQcPassed = useProcurementStore((state) => state.markQcPassed);

  const mergedPurchaseOrders = useMemo(
    () => purchaseOrders.map((po) => mergePurchaseOrderWithVendorDelivery(po, vendorDeliveries)),
    [purchaseOrders, vendorDeliveries],
  );

  const visibleOrders = useMemo(() => {
    const base = mergedPurchaseOrders.filter((po) =>
      ["PO Created", "Sent to Vendor", "Pending Receiving", "Received"].includes(po.procurementStatus),
    );

    if (currentRole === "Vendor") {
      return base.filter((po) => Boolean(po.selectedVendorName));
    }

    return base;
  }, [currentRole, mergedPurchaseOrders]);

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [isQcConfirmOpen, setIsQcConfirmOpen] = useState(false);
  const [successModal, setSuccessModal] = useState({
    open: false,
    title: "",
    description: "",
  });
  const [highlightedPoId, setHighlightedPoId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receivedQty, setReceivedQty] = useState(0);
  const [condition, setCondition] = useState<"Good" | "Damaged" | "Partial">("Good");
  const [lotNumber, setLotNumber] = useState("L-20260515");
  const [batchNumber, setBatchNumber] = useState("B-0912");
  const [expiryDate, setExpiryDate] = useState(
    () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [coaMsds, setCoaMsds] = useState(true);
  const [qcRequired, setQcRequired] = useState(true);

  const effectiveSelectedPoId = selectedPoId ?? visibleOrders[0]?.id ?? null;
  const selectedOrder = visibleOrders.find((order) => order.id === effectiveSelectedPoId) ?? null;
  const existingRecord = receivingRecords.find((record) => record.poId === effectiveSelectedPoId) ?? null;
  const canReceive = selectedOrder ? isReceivingEnabled(selectedOrder) : false;
  const isVendorView = currentRole === "Vendor";

  useEffect(() => {
    if (!highlightedPoId) {
      return;
    }

    const timer = window.setTimeout(() => setHighlightedPoId(null), 2800);
    return () => window.clearTimeout(timer);
  }, [highlightedPoId]);

  const handleReceive = async () => {
    if (!selectedOrder) return;

    await receivePo(selectedOrder.id, {
      deliveryDate,
      receivedQty,
      condition,
      lotNumber,
      batchNumber,
      expiryDate,
      coaMsds,
      qcRequired,
      qcStatus: qcRequired ? "Pending QC" : "Not Required",
      notes: "รับสินค้าตาม PO และบันทึกข้อมูลเข้าระบบเรียบร้อย",
    });

    setSuccessModal({
      open: true,
      title: "รับสินค้าสำเร็จ",
      description: qcRequired
        ? "ระบบได้บันทึกรับสินค้าเรียบร้อยแล้ว และส่งรายการเข้าสู่ขั้นตอน QC ระบบกำลังพากลับมาที่หน้าตรวจรับสินค้า"
        : "ระบบได้บันทึกรับสินค้าเรียบร้อยแล้ว ระบบกำลังพากลับมาที่หน้าตรวจรับสินค้า",
    });
  };

  const handleMarkQcPassed = async () => {
    if (!selectedOrder) return;

    await markQcPassed(selectedOrder.id);
    setSuccessModal({
      open: true,
      title: "ยืนยัน QC สำเร็จ",
      description: "ระบบได้บันทึกผลการตรวจสอบคุณภาพเรียบร้อยแล้ว ระบบกำลังพากลับมาที่หน้าตรวจรับสินค้า",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ตรวจรับสินค้า"
        subtitle={
          isVendorView
            ? "ติดตามสถานะจัดส่งและความพร้อมในการตรวจรับของแต่ละ PO"
            : "ติดตามสถานะการรับสินค้าและตรวจสอบคุณภาพจากข้อมูลอัปเดตของร้านค้า"
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {isVendorView ? "PO ของร้านค้า" : "PO รอรับสินค้า"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isVendorView
              ? "รายการ PO ที่ร้านค้าสามารถติดตามสถานะการจัดส่งได้"
              : "รายการ PO ที่พร้อมสำหรับการรับสินค้า"}
          </p>
          <div className="mt-5 space-y-3">
            {visibleOrders.length === 0 ? (
              <p className="text-sm text-slate-500">ไม่มีรายการในขณะนี้</p>
            ) : (
              visibleOrders.map((po) => (
                <button
                  key={po.id}
                  type="button"
                  onClick={() => setSelectedPoId(po.id)}
                  className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                    selectedPoId === po.id
                      ? "border-[#007946]/25 bg-[#f0f9f6]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } ${highlightedPoId === po.id ? "soft-highlight" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{po.poNumber ?? po.documentNumber}</p>
                      <p className="text-sm text-slate-500">{po.selectedVendorName ?? po.vendorName}</p>
                    </div>
                    <StatusBadge label={po.vendorDeliveryStatus ?? po.procurementStatus} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">ยอดเงิน {formatCurrency(po.amount)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6 ${selectedOrder?.id === highlightedPoId ? "soft-highlight" : ""}`}>
            {selectedOrder ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-slate-400">{selectedOrder.poNumber ?? selectedOrder.documentNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedOrder.memoTitle}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Vendor: {selectedOrder.selectedVendorName ?? selectedOrder.vendorName}
                    </p>
                  </div>
                  <StatusBadge label={selectedOrder.vendorDeliveryStatus ?? selectedOrder.procurementStatus} />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">สถานะจัดส่ง</p>
                    <div className="mt-2">
                      {selectedOrder.vendorDeliveryStatus ? (
                        <StatusBadge label={selectedOrder.vendorDeliveryStatus} />
                      ) : (
                        <span className="text-sm text-slate-400">ยังไม่อัปเดต</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">อัปเดตล่าสุด</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatVendorUpdateTimestamp(selectedOrder.vendorUpdatedAt)}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Tracking Number</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedOrder.trackingNumber ?? "-"}</p>
                  </div>
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">กำหนดส่งถึง</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedOrder.expectedDeliveryDate ?? "-"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Delivery Timeline</p>
                  <div className="mt-4 space-y-3">
                    {getVendorTimeline(selectedOrder).map((event) => (
                      <div
                        key={`${selectedOrder.id}-${event.label}`}
                        className={`rounded-[16px] border px-4 py-3 ${
                          event.complete ? "border-[#cfe1d7] bg-white" : "border-slate-200 bg-white/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-900">{event.label}</p>
                          <span className="text-xs text-slate-400">{formatVendorUpdateTimestamp(event.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.vendorDeliveryNote ? (
                  <div className="mt-5 rounded-[20px] border border-slate-200 bg-[#f8fbf9] p-4 text-sm text-slate-600">
                    {selectedOrder.vendorDeliveryNote}
                  </div>
                ) : null}

                {isVendorView ? null : (
                  <div className="mt-5 grid gap-4 text-sm text-slate-600">
                    <label className="space-y-2 text-slate-700">
                      วันที่ส่งมอบ
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(event) => setDeliveryDate(event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                    <label className="space-y-2 text-slate-700">
                      จำนวนที่รับ
                      <input
                        type="number"
                        min={0}
                        value={receivedQty}
                        onChange={(event) => setReceivedQty(Number(event.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-slate-700">
                        สภาพสินค้า
                        <select
                          value={condition}
                          onChange={(event) => setCondition(event.target.value as typeof condition)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                        >
                          <option>Good</option>
                          <option>Damaged</option>
                          <option>Partial</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-slate-700">
                        QC Required
                        <select
                          value={qcRequired ? "yes" : "no"}
                          onChange={(event) => setQcRequired(event.target.value === "yes")}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-slate-700">
                        เลขที่ LOT
                        <input
                          value={lotNumber}
                          onChange={(event) => setLotNumber(event.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                        />
                      </label>
                      <label className="space-y-2 text-slate-700">
                        เลขที่ Batch
                        <input
                          value={batchNumber}
                          onChange={(event) => setBatchNumber(event.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                        />
                      </label>
                    </div>
                    <label className="space-y-2 text-slate-700">
                      วันหมดอายุ
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(event) => setExpiryDate(event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900"
                      />
                    </label>
                    <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={coaMsds}
                        onChange={(event) => setCoaMsds(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#007946]"
                      />
                      COA / MSDS พร้อมใช้งาน
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQcConfirmOpen(true)}
                      disabled={!canReceive}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {canReceive ? "รับสินค้า" : "รอร้านค้าจัดส่งสินค้า"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">เลือก PO เพื่อดูรายละเอียด</p>
            )}
          </div>

          {!isVendorView && existingRecord ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-normal text-slate-400">สถานะ QC</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{existingRecord.qcStatus}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleMarkQcPassed();
                  }}
                  className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  ยืนยันผ่าน QC
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        open={isQcConfirmOpen}
        title="ยืนยันรับสินค้า?"
        description="กรุณาตรวจสอบข้อมูลรับสินค้าก่อนบันทึกเข้าระบบ"
        confirmLabel="ยืนยันรับสินค้า"
        cancelLabel="ยกเลิก"
        onCancel={() => setIsQcConfirmOpen(false)}
        onConfirm={() => {
          setIsQcConfirmOpen(false);
          void handleReceive();
        }}
      />
      <SuccessModal
        open={successModal.open}
        title={successModal.title}
        description={successModal.description}
        onClose={() => {
          setSuccessModal({ open: false, title: "", description: "" });
          setHighlightedPoId(selectedOrder?.id ?? null);
        }}
      />
    </div>
  );
}
