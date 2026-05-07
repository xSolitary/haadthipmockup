"use client";

import { useMemo, useState } from "react";
import { useProcurementStore } from "@/store/useProcurementStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function ReceivingPage() {
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const receivingRecords = useProcurementStore((state) => state.receivingRecords);
  const receivePo = useProcurementStore((state) => state.receivePo);
  const markQcPassed = useProcurementStore((state) => state.markQcPassed);

  const waitingOrders = useMemo(
    () => purchaseOrders.filter((po) => ["PO Created", "Sent to Vendor", "Pending Receiving", "Received"].includes(po.procurementStatus)),
    [purchaseOrders],
  );
  const [selectedPoId, setSelectedPoId] = useState<string | null>(waitingOrders[0]?.id ?? null);
  const selectedOrder = waitingOrders.find((order) => order.id === selectedPoId) ?? null;
  const existingRecord = receivingRecords.find((record) => record.poId === selectedPoId) ?? null;

  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receivedQty, setReceivedQty] = useState(0);
  const [condition, setCondition] = useState<"Good" | "Damaged" | "Partial">("Good");
  const [lotNumber, setLotNumber] = useState("L-20260515");
  const [batchNumber, setBatchNumber] = useState("B-0912");
  const [expiryDate, setExpiryDate] = useState(() => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [coaMsds, setCoaMsds] = useState(true);
  const [qcRequired, setQcRequired] = useState(true);

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
      notes: "รับสินค้าตาม PO และเผยแพร่ข้อมูลในระบบ",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Receiving & QC" subtitle="ติดตามการรับสินค้าจากผู้ขายและสถานะการตรวจสอบคุณภาพ" />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">PO รอรับสินค้า</h2>
          <p className="mt-2 text-sm text-slate-500">รายการ PO ที่พร้อมสำหรับการรับสินค้า</p>
          <div className="mt-5 space-y-3">
            {waitingOrders.length === 0 ? (
              <p className="text-sm text-slate-500">ไม่มี PO รอรับสินค้าในขณะนี้</p>
            ) : (
              waitingOrders.map((po) => (
                <button
                  key={po.id}
                  type="button"
                  onClick={() => setSelectedPoId(po.id)}
                  className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${selectedPoId === po.id ? "border-[#007946]/25 bg-[#f0f9f6]" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{po.documentNumber}</p>
                  <p className="text-sm text-slate-500">{po.selectedVendorName ?? po.vendorName}</p>
                    </div>
                    <StatusBadge label={po.procurementStatus} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">ยอด {formatCurrency(po.amount)}</p>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
            {selectedOrder ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-slate-400">{selectedOrder.documentNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedOrder.memoTitle}</h2>
                    <p className="mt-2 text-sm text-slate-500">Vendor: {selectedOrder.selectedVendorName ?? selectedOrder.vendorName}</p>
                  </div>
                  <StatusBadge label={selectedOrder.procurementStatus} />
                </div>
                <div className="grid gap-4 text-sm text-slate-600">
                  <label className="space-y-2 text-slate-700">
                    วันที่ส่งมอบ
                    <input type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900" />
                  </label>
                  <label className="space-y-2 text-slate-700">
                    จำนวนที่รับ
                    <input type="number" min={0} value={receivedQty} onChange={(event) => setReceivedQty(Number(event.target.value))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900" />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-slate-700">
                      สภาพสินค้า
                      <select value={condition} onChange={(event) => setCondition(event.target.value as typeof condition)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900">
                        <option>Good</option>
                        <option>Damaged</option>
                        <option>Partial</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-slate-700">
                      QC Required
                      <select value={qcRequired ? "yes" : "no"} onChange={(event) => setQcRequired(event.target.value === "yes")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-slate-700">
                      เลขที่ LOT
                      <input value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900" />
                    </label>
                    <label className="space-y-2 text-slate-700">
                      เลขที่ Batch
                      <input value={batchNumber} onChange={(event) => setBatchNumber(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900" />
                    </label>
                  </div>
                  <label className="space-y-2 text-slate-700">
                    วันหมดอายุ
                    <input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900" />
                  </label>
                  <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <input type="checkbox" checked={coaMsds} onChange={(event) => setCoaMsds(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#007946]" />
                    COA / MSDS พร้อมใช้งาน
                  </label>
                  <button type="button" onClick={handleReceive} className="inline-flex h-10 items-center justify-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37]">
                    รับสินค้า
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">เลือก PO เพื่อกรอกข้อมูลรับสินค้า</p>
            )}
          </div>
          {existingRecord ? (
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-normal text-slate-400">สถานะ QC</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{existingRecord.qcStatus}</p>
                </div>
                <button type="button" onClick={() => selectedOrder && void markQcPassed(selectedOrder.id)} className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Mark QC Passed
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
