"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, RefreshCcw } from "lucide-react";
import { useProcurementStore } from "@/store/useProcurementStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

const tabOptions = ["ทั้งหมด", "Memo", "PO"] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function ApprovalsPage() {
  const currentRole = useProcurementStore((state) => state.currentRole);
  const memos = useProcurementStore((state) => state.memos);
  const poApprovalRequests = useProcurementStore((state) => state.poApprovalRequests);
  const approveMemo = useProcurementStore((state) => state.approveMemo);
  const rejectMemo = useProcurementStore((state) => state.rejectMemo);
  const requestRevision = useProcurementStore((state) => state.requestRevision);
  const approvePO = useProcurementStore((state) => state.approvePO);
  const rejectPO = useProcurementStore((state) => state.rejectPO);

  const [activeTab, setActiveTab] = useState<(typeof tabOptions)[number]>("ทั้งหมด");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"Memo" | "PO" | null>(null);
  const [comment, setComment] = useState("");

  const pendingMemos = useMemo(() => {
    return memos.filter((memo) => memo.status === "Pending Approval");
  }, [memos]);

  const pendingPOs = useMemo(() => {
    return poApprovalRequests.filter((po) => po.status === "Pending");
  }, [poApprovalRequests]);

  const allItems = useMemo(() => {
    if (activeTab === "Memo") return pendingMemos;
    if (activeTab === "PO") return pendingPOs;
    return [...pendingMemos, ...pendingPOs];
  }, [activeTab, pendingMemos, pendingPOs]);

  const selectedMemo = selectedItemType === "Memo" ? memos.find((m) => m.id === selectedItemId) : null;
  const selectedPO = selectedItemType === "PO" ? poApprovalRequests.find((p) => p.id === selectedItemId) : null;

  const handleAction = (type: "approve" | "reject" | "revision") => {
    if (selectedItemType === "Memo" && selectedMemo) {
      if (type === "approve") approveMemo(selectedMemo.id, comment);
      if (type === "reject") rejectMemo(selectedMemo.id, comment);
      if (type === "revision") requestRevision(selectedMemo.id, comment);
    } else if (selectedItemType === "PO" && selectedPO) {
      if (type === "approve") approvePO(selectedPO.id, comment);
      if (type === "reject") rejectPO(selectedPO.id, comment);
    }
    setComment("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ศูนย์อนุมัติ" subtitle="ตรวจสอบและจัดการ Memo และ PO ก่อนนำไปสู่กระบวนการจัดซื้อ" />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            {tabOptions.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-[#007946] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab} ({tab === "Memo" ? pendingMemos.length : tab === "PO" ? pendingPOs.length : allItems.length})
              </button>
            ))}
          </div>
          
          {/* Memo Items */}
          {(activeTab === "ทั้งหมด" || activeTab === "Memo") && pendingMemos.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Memo ที่รออนุมัติ</h3>
              <DataTable headers={["เลขที่", "หัวข้อ", "ไซต์", "ยอด"]}>
                {pendingMemos.map((memo) => (
                  <tr
                    key={memo.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => {
                      setSelectedItemId(memo.id);
                      setSelectedItemType("Memo");
                    }}
                  >
                    <td className="px-4 py-4">{memo.documentNumber}</td>
                    <td className="px-4 py-4">{memo.title}</td>
                    <td className="px-4 py-4">{memo.site}</td>
                    <td className="px-4 py-4">{formatCurrency(memo.estimatedTotal)}</td>
                  </tr>
                ))}
              </DataTable>
            </div>
          )}

          {/* PO Items */}
          {(activeTab === "ทั้งหมด" || activeTab === "PO") && pendingPOs.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">PO ที่รออนุมัติ</h3>
              <DataTable headers={["เลขที่", "ผู้ขาย", "ยอด", "สถานะ"]}>
                {pendingPOs.map((po) => (
                  <tr
                    key={po.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    onClick={() => {
                      setSelectedItemId(po.id);
                      setSelectedItemType("PO");
                    }}
                  >
                    <td className="px-4 py-4">{po.documentNumber}</td>
                    <td className="px-4 py-4">{po.vendorName}</td>
                    <td className="px-4 py-4">{formatCurrency(po.amount)}</td>
                    <td className="px-4 py-4"><StatusBadge label={po.status} /></td>
                  </tr>
                ))}
              </DataTable>
            </div>
          )}

          {allItems.length === 0 && (
            <p className="text-sm text-slate-500">ไม่มีรายการรออนุมัติในขณะนี้</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            {selectedMemo ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-slate-400">{selectedMemo.documentNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedMemo.title}</h2>
                    <p className="mt-2 text-sm text-slate-500">{selectedMemo.department} • {selectedMemo.site}</p>
                  </div>
                  <StatusBadge label={selectedMemo.status} />
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">รายละเอียดคำขอ</p>
                    <p className="mt-2">{selectedMemo.purpose}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">รายการ</p>
                    <div className="mt-3 space-y-3">
                      {selectedMemo.items.map((item) => (
                        <div key={item.id} className="grid gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-100 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.category}</p>
                          </div>
                          <div>{item.quantity} {item.unit}</div>
                          <div className="text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs tracking-normal text-slate-400">ผู้อนุมัติปัจจุบัน</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedMemo.currentApproverName}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs tracking-normal text-slate-400">ยอดรวม</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(selectedMemo.estimatedTotal)}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : selectedPO ? (
              <>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-normal text-slate-400">{selectedPO.documentNumber}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">PO Approval Request</h2>
                    <p className="mt-2 text-sm text-slate-500">Vendor: {selectedPO.vendorName}</p>
                  </div>
                  <StatusBadge label={selectedPO.status} />
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">เหตุผล</p>
                    <p className="mt-2">{selectedPO.reason}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs tracking-normal text-slate-400">ยอดสั่งซื้อ</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatCurrency(selectedPO.amount)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs tracking-normal text-slate-400">ผู้ขาย</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedPO.vendorName}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-sm font-semibold text-amber-900">ต้องการอนุมัติ PO</p>
                    <p className="text-xs text-amber-700 mt-1">ยอดเกิน 50,000 บาท ต้องได้รับการอนุมัติจากผู้บริหาร</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">เลือกรายการเพื่อดูรายละเอียด</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">การตัดสินใจ</h2>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="เขียนความคิดเห็นหรือเงื่อนไขเพิ่มเติม"
              className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
            />
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleAction("approve")}
                disabled={!selectedItemId}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              {selectedItemType === "Memo" && (
                <button
                  type="button"
                  onClick={() => handleAction("revision")}
                  disabled={!selectedItemId}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <RefreshCcw className="h-4 w-4" /> Request Revision
                </button>
              )}
              <button
                type="button"
                onClick={() => handleAction("reject")}
                disabled={!selectedItemId}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">Role: {currentRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
