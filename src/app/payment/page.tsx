"use client";

import { useState } from "react";
import { useProcurementStore } from "@/store/useProcurementStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function PaymentPage() {
  const paymentRequests = useProcurementStore((state) => state.paymentRequests);
  const updatePaymentStatus = useProcurementStore((state) => state.updatePaymentStatus);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(paymentRequests[0]?.id ?? null);

  const selectedPayment = paymentRequests.find((payment) => payment.id === selectedPaymentId) ?? null;

  const handleStatus = () => {
    if (!selectedPayment) return;
    if (selectedPayment.status === "Pending Invoice") {
      updatePaymentStatus(selectedPayment.poId, "Ready for AP Posting");
    } else if (selectedPayment.status === "Ready for AP Posting") {
      updatePaymentStatus(selectedPayment.poId, "Approved for Payment");
    } else if (selectedPayment.status === "Approved for Payment") {
      updatePaymentStatus(selectedPayment.poId, "Paid");
    }
  };

  const actionLabel = selectedPayment?.status === "Pending Invoice"
    ? "ยืนยัน Invoice"
    : selectedPayment?.status === "Ready for AP Posting"
    ? "อนุมัติสำหรับจ่าย"
    : selectedPayment?.status === "Approved for Payment"
    ? "ทำเครื่องหมายว่า Paid"
    : "เสร็จสิ้น";

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Request" subtitle="ติดตามความพร้อมในการจ่ายเงินและการจับคู่ข้อมูลใบสั่งซื้อ" />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">รายการจ่ายเงิน</h2>
          <p className="mt-2 text-sm text-slate-500">ติดตามสถานะการจ่ายเงินสำหรับ PO ที่ผ่าน QC แล้ว</p>
          <div className="mt-5">
            <DataTable headers={["PO", "ผู้ขาย", "ยอดใบแจ้งหนี้", "สถานะ"]}>
              {paymentRequests.map((payment) => (
                <tr key={payment.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setSelectedPaymentId(payment.id)}>
                  <td className="px-5 py-4">{payment.poNumber}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{payment.vendorName}</td>
                  <td className="px-5 py-4">{formatCurrency(payment.invoiceAmount)}</td>
                  <td className="px-5 py-4"><StatusBadge label={payment.status} /></td>
                </tr>
              ))}
            </DataTable>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
            {selectedPayment ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-slate-400">{selectedPayment.poNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedPayment.vendorName}</h2>
                  </div>
                  <StatusBadge label={selectedPayment.status} />
                </div>
                <div className="grid gap-4 text-sm text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs tracking-normal text-slate-400">PO amount</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(selectedPayment.invoiceAmount)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs tracking-normal text-slate-400">Receiving amount</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(selectedPayment.receivingAmount)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs tracking-normal text-slate-400">Matching status</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {selectedPayment.invoiceAmount === selectedPayment.receivingAmount ? "Matched" : "Pending Review"}
                    </p>
                  </div>
                  <label className="rounded-[20px] border border-slate-200 bg-slate-100 p-4 text-sm text-slate-700">
                    <span className="block text-xs tracking-normal text-slate-400">Invoice upload</span>
                    <span className="mt-2 block font-semibold text-slate-900">{selectedPayment.invoiceUploaded ? "ใบแจ้งหนี้อัปโหลดแล้ว" : "ยังไม่ได้อัปโหลด"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleStatus}
                    disabled={selectedPayment.status === "Paid"}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white transition hover:bg-[#005f37] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {actionLabel}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">เลือกรายการเพื่อดูสถานะการชำระเงิน</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
