"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useProcurementStore } from "@/store/useProcurementStore";
import type { PurchaseOrder } from "@/lib/types";

type ProcureTab = "memo" | "pr" | "po";
type DetailState =
  | { type: "memo"; id: string }
  | { type: "pr"; id: string }
  | { type: "po"; id: string }
  | null;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);

const poStatuses: PurchaseOrder["procurementStatus"][] = [
  "PO Created",
  "Sent to Vendor",
  "Pending Receiving",
  "Received",
  "QC Passed",
];

function SummaryTabCard({
  active,
  label,
  count,
  pendingCount,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  pendingCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[180px] flex-1 rounded-[24px] border px-5 py-5 text-left transition ${
        active
          ? "border-[#007946] bg-gradient-to-br from-[#007946] to-[#0a8f57] text-white shadow-[0_18px_40px_rgba(0,121,70,0.18)]"
          : "border-slate-200 bg-[#f8fbf9] text-slate-900 shadow-sm shadow-slate-200/50 hover:border-[#007946]/20 hover:bg-white"
      }`}
    >
      <div className="text-[1.85rem] font-semibold leading-none">
        {label}
        {pendingCount > 0 ? ` (${pendingCount})` : ""}
      </div>
      <div className={`mt-2 text-sm ${active ? "text-white/80" : "text-slate-500"}`}>{count} items</div>
    </button>
  );
}

function DetailModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-slate-200/80 bg-slate-50 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="mt-2 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function ProcureToPayPage({ initialTab = "memo" }: { initialTab?: ProcureTab }) {
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const memos = useProcurementStore((state) => state.memos);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);

  const [activeTab, setActiveTab] = useState<ProcureTab>(initialTab);
  const [detailState, setDetailState] = useState<DetailState>(null);

  const memoById = useMemo(() => new Map(memos.map((memo) => [memo.id, memo])), [memos]);
  const availableTabs: ProcureTab[] =
    currentRole === "Requester"
      ? ["memo"]
      : currentRole === "Purchasing"
        ? ["pr", "po"]
        : ["memo", "pr", "po"];

  const memoRequests = useMemo(
    () =>
      memos
        .filter((memo) => {
          if (memo.status === "Pending Approval") {
            return memo.requesterId === currentUserId || memo.assignedApproverId === currentUserId;
          }
          if (memo.status === "Draft" || memo.status === "Revision Required") {
            return memo.requesterId === currentUserId;
          }
          return false;
        })
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [currentUserId, memos],
  );

  const prItems = useMemo(
    () =>
      purchaseOrders
        .filter((po) => {
          const memo = memoById.get(po.memoId);
          if (!memo) return false;
          if (currentRole === "Purchasing") return true;
          if (currentRole === "Approver") return memo.assignedApproverId === currentUserId;
          return memo.requesterId === currentUserId;
        })
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [currentRole, currentUserId, memoById, purchaseOrders],
  );

  const poItems = useMemo(
    () =>
      purchaseOrders
        .filter((po) => poStatuses.includes(po.procurementStatus))
        .filter((po) => {
          const memo = memoById.get(po.memoId);
          if (!memo) return false;
          if (currentRole === "Purchasing") return true;
          if (currentRole === "Approver") return memo.assignedApproverId === currentUserId;
          return memo.requesterId === currentUserId;
        })
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [currentRole, currentUserId, memoById, purchaseOrders],
  );

  const selectedMemo = detailState?.type === "memo" ? memos.find((memo) => memo.id === detailState.id) ?? null : null;
  const selectedPr = detailState?.type === "pr" ? purchaseOrders.find((po) => po.id === detailState.id) ?? null : null;
  const selectedPo = detailState?.type === "po" ? purchaseOrders.find((po) => po.id === detailState.id) ?? null : null;

  const memoPendingCount = useMemo(
    () => memos.filter((memo) => memo.status === "Pending Approval").length,
    [memos],
  );

  const prPendingCount = useMemo(() => {
    const managerStatuses: PurchaseOrder["procurementStatus"][] = ["Pending Vendor Approval", "Pending PR Approval"];
    const purchasingStatuses: PurchaseOrder["procurementStatus"][] = [
      "Waiting for Purchasing to Propose Vendors",
      "Pending Vendor Approval",
      "Pending PR Approval",
    ];
    const statuses = currentRole === "Purchasing" ? purchasingStatuses : managerStatuses;
    return purchaseOrders.filter((po) => statuses.includes(po.procurementStatus)).length;
  }, [currentRole, purchaseOrders]);

  const poPendingCount = useMemo(
    () => purchaseOrders.filter((po) => ["PO Created", "Sent to Vendor", "Pending Receiving", "Received"].includes(po.procurementStatus)).length,
    [purchaseOrders],
  );

  const tabMeta = [
    { id: "memo" as const, label: "Memo Request", count: memoRequests.length, pendingCount: memoPendingCount },
    { id: "pr" as const, label: "PR", count: prItems.length, pendingCount: prPendingCount },
    { id: "po" as const, label: "PO", count: poItems.length, pendingCount: poPendingCount },
  ];
  const visibleTabs = tabMeta.filter((tab) => availableTabs.includes(tab.id));
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];

  const openDetail = (type: "memo" | "pr" | "po", id: string) => {
    if (type !== activeTab) {
      setActiveTab(type);
    }
    setDetailState({ type, id });
  };

  const closeDetail = () => {
    setDetailState(null);
  };
  const canCreateMemo = currentRole === "Requester";
  const getMemoActionHref = (memoId: string) => {
    const memo = memos.find((item) => item.id === memoId);
    if (!memo) return null;
    if (memo.requesterId === currentUserId && (memo.status === "Draft" || memo.status === "Revision Required")) {
      return `/memo/${memo.id}/edit`;
    }
    if (currentRole === "Approver" && memo.assignedApproverId === currentUserId && memo.status === "Pending Approval") {
      return `/memo/${memo.id}/action`;
    }
    return null;
  };
  const getPrActionHref = (poId: string) => {
    const po = purchaseOrders.find((item) => item.id === poId);
    if (!po) return null;
    if (currentRole === "Purchasing") return `/pr-po/${po.id}/action`;
    if (currentRole === "Approver" && po.procurementStatus === "Pending Vendor Approval") {
      return `/pr-po/${po.id}/action`;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procure-to-Pay"
        subtitle="รวม Memo Request, PR และ PO ของทุกขั้นตอนในกระบวนการจัดซื้อ"
        actions={
          canCreateMemo ? (
            <Link
              href="/memo/create"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-[#005f37]"
            >
              <Plus className="h-4 w-4" /> Create Memo
            </Link>
          ) : null
        }
      />

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
        <div className="mb-6 flex flex-wrap gap-3 xl:flex-nowrap">
          {visibleTabs.map((tab) => (
            <SummaryTabCard
              key={tab.id}
              active={currentTab === tab.id}
              label={tab.label}
              count={tab.count}
              pendingCount={tab.pendingCount}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {currentTab === "memo" ? (
          memoRequests.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">ยังไม่มี memo ที่ต้องจัดการสำหรับบทบาทนี้</p>
          ) : (
            <DataTable
              headers={["เลขที่", "หัวข้อ", "ไซต์", "ยอด", "สถานะ", ""]}
              tableClassName="min-w-[920px]"
            >
              {memoRequests.map((memo) => (
                <tr key={memo.id} className="border-t border-slate-100 transition hover:bg-[#f8fcf9]">
                  <td className="px-5 py-4 text-slate-700">{memo.documentNumber}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{memo.title}</td>
                  <td className="px-5 py-4">{memo.site}</td>
                  <td className="px-5 py-4">{formatCurrency(memo.estimatedTotal)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={memo.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {getMemoActionHref(memo.id) ? (
                        <Link href={getMemoActionHref(memo.id) ?? "#"} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946]">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openDetail("memo", memo.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946]"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )
        ) : null}

        {currentTab === "pr" ? (
          prItems.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">ยังไม่มี PR สำหรับบทบาทนี้</p>
          ) : (
            <DataTable
              headers={["PR", "หัวข้อ", "Vendor Options", "Selected Vendor", "สถานะ", ""]}
              tableClassName="min-w-[1040px]"
            >
              {prItems.map((po) => (
                <tr key={po.id} className="border-t border-slate-100 transition hover:bg-[#f8fcf9]">
                  <td className="px-5 py-4 text-slate-700">{po.prNumber ?? po.documentNumber}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{po.memoTitle}</td>
                  <td className="px-5 py-4">{po.vendorProposals.length}</td>
                  <td className="px-5 py-4">{po.selectedVendorName ?? "-"}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={po.procurementStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {getPrActionHref(po.id) ? (
                        <Link href={getPrActionHref(po.id) ?? "#"} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946]">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openDetail("pr", po.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946]"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )
        ) : null}

        {currentTab === "po" ? (
          poItems.length === 0 ? (
            <p className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">ยังไม่มี PO ในช่วงนี้</p>
          ) : (
            <DataTable
              headers={["PO", "หัวข้อ", "Vendor", "ยอด", "สถานะ", ""]}
              tableClassName="min-w-[1040px]"
            >
              {poItems.map((po) => (
                <tr key={po.id} className="border-t border-slate-100 transition hover:bg-[#f8fcf9]">
                  <td className="px-5 py-4 text-slate-700">{po.poNumber ?? po.documentNumber}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{po.memoTitle}</td>
                  <td className="px-5 py-4">{po.selectedVendorName ?? po.vendorName}</td>
                  <td className="px-5 py-4">{formatCurrency(po.amount)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge label={po.procurementStatus} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail("po", po.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946]"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )
        ) : null}
      </section>

      {selectedMemo ? (
        <DetailModal title="Memo Request Detail" onClose={closeDetail}>
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{selectedMemo.documentNumber}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedMemo.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedMemo.site} • {selectedMemo.department}
                </p>
              </div>
              <StatusBadge label={selectedMemo.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Request Date" value={selectedMemo.requestDate} />
              <InfoCard label="Required Date" value={selectedMemo.requiredDate} />
              <InfoCard label="Estimated Total" value={formatCurrency(selectedMemo.estimatedTotal)} />
              <InfoCard label="Procurement" value={<StatusBadge label={selectedMemo.procurementStatus} />} />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">Purpose</p>
              <p className="mt-3 text-sm text-slate-600">{selectedMemo.purpose}</p>
            </div>

            <DataTable headers={["Item", "Category", "Qty", "Amount"]} tableClassName="min-w-[720px]">
              {selectedMemo.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-5 py-4">{item.category}</td>
                  <td className="px-5 py-4">
                    {item.quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-5 py-4">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DetailModal>
      ) : null}

      {selectedPr ? (
        <DetailModal title="PR Detail & Vendor Proposal Flow" onClose={closeDetail}>
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{selectedPr.prNumber ?? selectedPr.documentNumber}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedPr.memoTitle}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Requester: {memoById.get(selectedPr.memoId)?.requesterName ?? "-"}
                </p>
              </div>
              <StatusBadge label={selectedPr.procurementStatus} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="PR Number" value={selectedPr.prNumber ?? selectedPr.documentNumber} />
              <InfoCard label="PO Number" value={selectedPr.poNumber ?? "-"} />
              <InfoCard label="Current Value" value={formatCurrency(selectedPr.amount)} />
              <InfoCard label="Selected Vendor" value={selectedPr.selectedVendorName ?? "-"} />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-200/30">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="font-semibold text-slate-900">Vendor Options</p>
              </div>
              <div className="space-y-3 p-5">
                {selectedPr.vendorProposals.length === 0 ? (
                  <p className="text-sm text-slate-500">No vendor proposals yet.</p>
                ) : (
                  selectedPr.vendorProposals.map((proposal) => (
                    <div key={proposal.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{proposal.vendorName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Lead time: {proposal.leadTime} • Terms: {proposal.paymentTerms}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">{proposal.notes}</p>
                          {proposal.attachmentName ? (
                            <p className="mt-2 text-sm text-sky-700">
                              Attachment: {proposal.attachmentName}
                              {proposal.attachmentUrl ? ` (${proposal.attachmentUrl})` : ""}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <p className="text-xl font-semibold text-slate-900">{formatCurrency(proposal.quotedPrice)}</p>
                          {proposal.submittedToApprover ? <StatusBadge label="Submitted" /> : null}
                          {selectedPr.selectedVendorName === proposal.vendorName ? (
                            <StatusBadge label="Vendor Approved" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">History</p>
              <div className="mt-4 space-y-3">
                {selectedPr.history.length === 0 ? (
                  <p className="text-sm text-slate-500">No PR history yet.</p>
                ) : (
                  selectedPr.history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div key={`${entry.id}-${entry.date}-${entry.action}-${entry.actorId}-${index}`} className="rounded-[20px] border border-slate-200/70 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{entry.action}</p>
                          <span className="text-xs text-slate-400">{entry.date.slice(0, 10)}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{entry.comment}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {entry.actorName} • {entry.role}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </DetailModal>
      ) : null}

      {selectedPo ? (
        <DetailModal title="PO Detail" onClose={closeDetail}>
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{selectedPo.poNumber ?? selectedPo.documentNumber}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selectedPo.memoTitle}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Vendor: {selectedPo.selectedVendorName ?? selectedPo.vendorName}
                </p>
              </div>
              <StatusBadge label={selectedPo.procurementStatus} />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="PO Number" value={selectedPo.poNumber ?? "-"} />
              <InfoCard label="PR Number" value={selectedPo.prNumber ?? selectedPo.documentNumber} />
              <InfoCard label="Amount" value={formatCurrency(selectedPo.amount)} />
              <InfoCard label="Vendor" value={selectedPo.selectedVendorName ?? selectedPo.vendorName} />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">PO Status Flow</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["PO Created", "Sent to Vendor", "Pending Receiving", "Received", "QC Passed"].map((status) => (
                  <span
                    key={status}
                    className={`rounded-full px-3 py-2 text-sm font-medium ${
                      selectedPo.procurementStatus === status
                        ? "bg-[#007946] text-white"
                        : "border border-slate-200 bg-white text-slate-500 shadow-sm"
                    }`}
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => alert(`ดาวน์โหลด PO สำเร็จ (Mock)\nDocument: ${selectedPo.poNumber ?? selectedPo.documentNumber}`)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <Download className="h-4 w-4" /> Download PO
              </button>
            </div>
          </div>
        </DetailModal>
      ) : null}
    </div>
  );
}
