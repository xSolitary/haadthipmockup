"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Package, Send, Download, AlertCircle } from "lucide-react";
import { useProcurementStore } from "@/store/useProcurementStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function VendorSelectionPage() {
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const vendors = useProcurementStore((state) => state.vendors);
  const createPO = useProcurementStore((state) => state.createPO);
  const sendToVendor = useProcurementStore((state) => state.sendToVendor);
  const selectVendor = useProcurementStore((state) => state.selectVendor);
  const sendPOForApproval = useProcurementStore((state) => state.sendPOForApproval);

  const [selectedPoId, setSelectedPoId] = useState<string | null>(purchaseOrders[0]?.id ?? null);

  const selectedOrder = purchaseOrders.find((po) => po.id === selectedPoId) ?? null;

  const recommendedVendors = useMemo(
    () => vendors.sort((a, b) => a.price - b.price),
    [vendors],
  );

  const needsApproval = selectedOrder ? selectedOrder.amount > 50000 : false;
  const isApproved = selectedOrder?.poApprovalStatus === "Approved";
  const canDownloadPO = isApproved || !needsApproval;
  const isPOCreated = selectedOrder?.procurementStatus === "PO Created" || selectedOrder?.procurementStatus === "Pending PO Approval" || selectedOrder?.procurementStatus === "PO Approved";

  const handleDownloadPO = () => {
    alert("ดาวน์โหลด PO สำเร็จ (Mock)\nDocument: " + selectedOrder?.documentNumber);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Selection" subtitle="เลือกผู้ขายและจัดการ PO พร้อมอนุมัติตามเงื่อนไข" />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">รายการ PR / PO</h2>
          <p className="mt-2 text-sm text-slate-500">รายการที่พร้อมสำหรับการจัดซื้อ</p>
          <div className="mt-5">
            <DataTable headers={["เลขที่", "หัวข้อ", "สถานะ", "ยอด"]}>
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setSelectedPoId(po.id)}>
                  <td className="px-4 py-4">{po.documentNumber}</td>
                  <td className="px-4 py-4">{po.memoTitle}</td>
                  <td className="px-4 py-4"><StatusBadge label={po.procurementStatus} /></td>
                  <td className="px-4 py-4">{formatCurrency(po.amount)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            {selectedOrder ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-slate-400">{selectedOrder.documentNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedOrder.memoTitle}</h2>
                    <p className="mt-2 text-sm text-slate-500">Vendor: {selectedOrder.vendorName}</p>
                  </div>
                  <StatusBadge label={selectedOrder.procurementStatus} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs tracking-normal text-slate-400">ยอดรวม PR</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(selectedOrder.amount)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs tracking-normal text-slate-400">วันที่สร้าง</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.createdAt.slice(0, 10)}</p>
                  </div>
                </div>

                {needsApproval && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">ยอดสั่งซื้อมากกว่า 50,000 บาท</p>
                      <p className="text-xs text-amber-700 mt-1">ต้องส่งให้หัวหน้าอนุมัติ PO ก่อนส่งให้ผู้ขาย</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Lifecycle</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">PR</span>
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">Vendor Selection</span>
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">PO</span>
                      <span className="rounded-full bg-white px-3 py-2 shadow-sm">Vendor</span>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">ตัวเลือกผู้ขาย</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      {recommendedVendors.map((vendor) => (
                        <div key={vendor.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{vendor.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{vendor.badge} • {vendor.leadTime} • {vendor.creditTerm}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-slate-900">{formatCurrency(vendor.price)}</p>
                              <p className="text-xs text-slate-500">Rating {vendor.rating}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => selectVendor(selectedOrder.id, vendor.id)}
                            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#007946] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#005f37]"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Select Vendor
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => createPO(selectedOrder.id)}
                      disabled={selectedOrder.procurementStatus !== "Vendor Selected"}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <Package className="h-4 w-4" /> Create PO
                    </button>
                    
                    {needsApproval && isPOCreated && selectedOrder.procurementStatus !== "Pending PO Approval" && selectedOrder.procurementStatus !== "PO Approved" && (
                      <button
                        type="button"
                        onClick={() => sendPOForApproval(selectedOrder.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                      >
                        <Send className="h-4 w-4" /> Send for PO Approval
                      </button>
                    )}

                    {needsApproval && selectedOrder.procurementStatus === "Pending PO Approval" && (
                      <div className="rounded-2xl border border-orange-300 bg-orange-50 p-3">
                        <p className="text-sm font-semibold text-orange-900">รอการอนุมัติ PO</p>
                        <p className="text-xs text-orange-700 mt-1">กำลังรอหัวหน้าอนุมัติก่อนส่งให้ผู้ขาย</p>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => sendToVendor(selectedOrder.id)}
                      disabled={!isApproved && needsApproval}
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" /> Send to Vendor
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPO}
                      disabled={!canDownloadPO}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" /> Download PO
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">เลือก PO เพื่อดูรายละเอียด</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

