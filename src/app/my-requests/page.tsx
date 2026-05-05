"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useProcurementStore } from "@/store/useProcurementStore";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

export default function MyRequestsPage() {
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const memos = useProcurementStore((state) => state.memos);
  const [selectedMemoId, setSelectedMemoId] = useState<string | null>(null);

  const myMemos = useMemo(
    () => memos.filter((memo) => memo.requesterId === currentUserId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [currentUserId, memos],
  );

  const selectedMemo = myMemos.find((memo) => memo.id === selectedMemoId) ?? myMemos[0] ?? null;

  const canDownloadPR = selectedMemo?.status === "Approved" || selectedMemo?.status === "Converted to PR";

  const handleDownloadPR = () => {
    alert("ดาวน์โหลด PR สำเร็จ (Mock)\nDocument: " + selectedMemo?.prNumber || selectedMemo?.documentNumber);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="การขอซื้อของฉัน" subtitle="ติดตามสถานะ Memo ที่คุณส่งทั้งหมด" />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">รายการ Memo ของฉัน</h2>
              <p className="mt-1 text-sm text-slate-500">จัดการ Memo ตามสถานะเอกสาร</p>
            </div>
          </div>
          {myMemos.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มี Memo ของคุณในระบบ</p>
          ) : (
            <DataTable headers={["เลขที่", "หัวข้อ", "ไซต์", "ยอด", "สถานะ"]}>
              {myMemos.map((memo) => (
                <tr key={memo.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setSelectedMemoId(memo.id)}>
                  <td className="px-4 py-4 text-slate-700">{memo.documentNumber}</td>
                  <td className="px-4 py-4">{memo.title}</td>
                  <td className="px-4 py-4">{memo.site}</td>
                  <td className="px-4 py-4">{formatCurrency(memo.estimatedTotal)}</td>
                  <td className="px-4 py-4"><StatusBadge label={memo.status} /></td>
                </tr>
              ))}
            </DataTable>
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
                    <p className="mt-2 text-sm text-slate-500">{selectedMemo.site} • {selectedMemo.department}</p>
                  </div>
                  <StatusBadge label={selectedMemo.status} />
                </div>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">คำอธิบาย</p>
                    <p className="mt-2">{selectedMemo.purpose}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs tracking-normal text-slate-400">วันที่ขอ</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedMemo.requestDate}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs tracking-normal text-slate-400">วันที่ต้องการ</p>
                      <p className="mt-2 font-semibold text-slate-900">{selectedMemo.requiredDate}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs tracking-normal text-slate-400">รายการสินค้า</p>
                    <div className="mt-3 space-y-3">
                      {selectedMemo.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm shadow-slate-100">
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.category}</p>
                          </div>
                          <div className="text-right text-sm text-slate-600">
                            <p>{item.quantity.toLocaleString()} {item.unit}</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {canDownloadPR && (
                  <button
                    type="button"
                    onClick={handleDownloadPR}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#007946] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#005f37]"
                  >
                    <Download className="h-4 w-4" /> Download PR
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">เลือก Memo เพื่อดูรายละเอียด</p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">ประวัติการอนุมัติ</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              {selectedMemo?.history.slice().reverse().map((entry, index) => (
                <div key={`${entry.action}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{entry.action}</p>
                    <span className="text-xs text-slate-500">{entry.date.slice(0, 10)}</span>
                  </div>
                  <p className="mt-2 text-slate-600">{entry.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">{entry.actorName} • {entry.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
