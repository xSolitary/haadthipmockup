"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Search, X } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MemoRequest, PurchaseOrder } from "@/lib/types";
import { getCategoryLabel, getStatusLabel } from "@/lib/ui-text";
import { useProcurementStore } from "@/store/useProcurementStore";

type ProcureTab = "memo" | "pr" | "po";
type DetailState =
  | { type: "memo"; id: string }
  | { type: "pr"; id: string }
  | { type: "po"; id: string }
  | null;
type PreviewState =
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

const dashboardShellClass = "rounded-[30px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]";
const dashboardInnerCardClass = "rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] shadow-[var(--shadow-sm)]";
const dashboardControlClass =
  "h-11 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] text-sm text-slate-700 shadow-[var(--shadow-sm)] transition focus:outline-none focus:ring-0";
const mockSuccessText = {
  pr: "\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14 PR \u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 (Mock)",
  po: "\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14 PO \u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 (Mock)",
} as const;

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
      className={`relative flex min-h-[88px] w-full items-start justify-between overflow-hidden rounded-[24px] border px-5 py-4 text-left transition ${
        active
          ? "border-[#007946]/20 bg-[var(--surface-tint)] shadow-[var(--shadow-sm)]"
          : "border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:border-[#007946]/20 hover:bg-[var(--surface-strong)]"
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${active ? "bg-[#007946]" : "bg-transparent"}`} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{label}</span>
          <span
            className={`inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              active ? "bg-[#e3f3eb] text-[#0d5738]" : "bg-slate-100 text-slate-600"
            }`}
          >
            {pendingCount}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">{count} รายการ</p>
      </div>
      <div className={`mt-0.5 h-9 w-9 rounded-2xl border ${active ? "border-[#cfe1d7] bg-[#f4fbf7]" : "border-[var(--border)] bg-[var(--surface-strong)]"}`} />
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
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/32 p-4 backdrop-blur-sm">
      <div className={`max-h-[92vh] w-full max-w-5xl overflow-hidden ${dashboardShellClass} shadow-[var(--shadow-md)]`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 text-slate-500 transition hover:border-[#007946]/20 hover:bg-[var(--surface-strong)] hover:text-[var(--primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={`${dashboardInnerCardClass} p-4`}>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1.5 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ActionIconLink({ href, icon, title }: { href: string; icon: ReactNode; title: string }) {
  return (
    <Link
      href={href}
      title={title}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-slate-600 shadow-[var(--shadow-sm)] transition hover:border-[#007946]/25 hover:bg-[var(--surface-tint)] hover:text-[#007946]"
    >
      {icon}
    </Link>
  );
}

function ActionIconButton({ onClick, icon, title }: { onClick: () => void; icon: ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-slate-600 shadow-[var(--shadow-sm)] transition hover:border-[#007946]/25 hover:bg-[var(--surface-tint)] hover:text-[#007946]"
    >
      {icon}
    </button>
  );
}

function PreviewField({ label, value, align = "left" }: { label: string; value: ReactNode; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function PreviewModal({
  title,
  onClose,
  onDownload,
  downloadLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  onDownload: () => void;
  downloadLabel: string;
  children: ReactNode;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/42 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/70 bg-[rgba(249,251,250,0.96)] shadow-[0_32px_90px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#dbe8e0] bg-[linear-gradient(135deg,rgba(0,121,70,0.14),rgba(255,255,255,0.78))] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#007946]">Document Preview</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#cfe1d7] bg-white/90 p-2 text-slate-500 transition hover:border-[#007946]/30 hover:text-[#007946]"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-154px)] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(0,121,70,0.08),_transparent_42%)] px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#dbe8e0] bg-white/92 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-[18px] border border-[#d7e4dc] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#007946]/25 hover:text-[#007946]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-[#007946] px-4 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(0,121,70,0.22)] transition hover:bg-[#00653b]"
          >
            <Download className="h-4 w-4" />
            {downloadLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrDocumentPreview({ purchaseOrder, memo }: { purchaseOrder: PurchaseOrder; memo: MemoRequest | null }) {
  const items = memo?.items ?? [];

  return (
    <div className="rounded-[28px] border border-[#dbe8e0] bg-white p-4 shadow-[0_20px_44px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="rounded-[24px] border border-[#d7e4dc] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,247,0.98))] p-5 sm:p-7">
        <div className="flex flex-col gap-6 border-b border-dashed border-[#c9d8cf] pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#007946]">HaadThip Public Company Limited</p>
              <p className="mt-1 text-xs text-slate-500">Purchase Request document preview</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewField label="Document No" value={purchaseOrder.prNumber ?? purchaseOrder.documentNumber} />
              <PreviewField label="Requester" value={memo?.requesterName ?? "-"} />
              <PreviewField label="Department" value={memo?.department ?? "-"} />
              <PreviewField
                label="Status"
                value={<StatusBadge label={purchaseOrder.procurementStatus} className="min-h-7 min-w-0 px-2.5 text-[11px]" />}
              />
            </div>
          </div>

          <div className="rounded-[22px] border border-[#d7e4dc] bg-[#f6fbf8] px-5 py-4 text-center lg:min-w-[230px]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Purchase Request</p>
            <p className="mt-2 text-2xl font-semibold tracking-[0.08em] text-slate-900">PR</p>
            <p className="mt-3 text-xs text-slate-500">{memo?.requestDate ?? purchaseOrder.createdAt.slice(0, 10)}</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#d7e4dc]">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#eef7f1] text-slate-700">
              <tr>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-left font-semibold">Item</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-right font-semibold">Qty</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-left font-semibold">Unit</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#edf3ef] last:border-b-0">
                  <td className="px-4 py-3 text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f8fbf9]">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Total Amount
                </td>
                <td className="px-4 py-3 text-right text-base font-semibold text-[#007946]">
                  {formatCurrency(memo?.estimatedTotal ?? purchaseOrder.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function PoDocumentPreview({ purchaseOrder, memo }: { purchaseOrder: PurchaseOrder; memo: MemoRequest | null }) {
  const items = memo?.items ?? [];
  const selectedProposal =
    purchaseOrder.vendorProposals.find((proposal) => proposal.vendorName === purchaseOrder.selectedVendorName) ??
    purchaseOrder.vendorProposals[0];

  return (
    <div className="rounded-[28px] border border-[#dbe8e0] bg-white p-4 shadow-[0_20px_44px_rgba(15,23,42,0.12)] sm:p-6">
      <div className="rounded-[24px] border border-[#d7e4dc] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.98))] p-5 sm:p-7">
        <div className="flex flex-col gap-6 border-b border-dashed border-[#c9d8cf] pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#007946]">HaadThip Public Company Limited</p>
              <p className="mt-1 text-xs text-slate-500">Purchase Order document preview</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PreviewField label="PO No" value={purchaseOrder.poNumber ?? purchaseOrder.documentNumber} />
              <PreviewField label="Vendor" value={purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName} />
              <PreviewField label="Delivery Address" value={memo?.deliveryLocation ?? "-"} />
              <PreviewField label="Payment Term" value={selectedProposal?.paymentTerms ?? "-"} />
            </div>
          </div>

          <div className="grid gap-4 rounded-[22px] border border-[#d7e4dc] bg-[#f6fbf8] px-5 py-4 xl:min-w-[260px]">
            <PreviewField label="Total Amount" value={<span className="text-lg text-[#007946]">{formatCurrency(purchaseOrder.amount)}</span>} align="right" />
            <PreviewField label="PR Ref" value={purchaseOrder.prNumber ?? purchaseOrder.documentNumber} align="right" />
            <PreviewField label="Issue Date" value={purchaseOrder.updatedAt.slice(0, 10)} align="right" />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#d7e4dc]">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#eef7f1] text-slate-700">
              <tr>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-left font-semibold">Item</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-right font-semibold">Qty</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-left font-semibold">Unit</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-right font-semibold">Amount</th>
                <th className="border-b border-[#d7e4dc] px-4 py-3 text-left font-semibold">Remark</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {items.map((item) => (
                <tr key={item.id} className="border-b border-[#edf3ef] last:border-b-0">
                  <td className="px-4 py-3 text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{selectedProposal?.leadTime ? `Lead time ${selectedProposal.leadTime}` : "-"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f8fbf9]">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  Total Amount
                </td>
                <td className="px-4 py-3 text-right text-base font-semibold text-[#007946]">
                  {formatCurrency(purchaseOrder.amount)}
                </td>
                <td className="px-4 py-3 text-slate-500">{selectedProposal?.notes ?? "-"}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function matchesMemoSearch(memo: MemoRequest, searchTerm: string) {
  if (!searchTerm) return true;
  const query = searchTerm.toLowerCase();
  return [
    memo.documentNumber,
    memo.title,
    memo.site,
    memo.department,
    memo.status,
    memo.procurementStatus,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesPoSearch(po: PurchaseOrder, searchTerm: string) {
  if (!searchTerm) return true;
  const query = searchTerm.toLowerCase();
  return [
    po.documentNumber,
    po.prNumber ?? "",
    po.poNumber ?? "",
    po.memoTitle,
    po.selectedVendorName ?? "",
    po.vendorName,
    po.procurementStatus,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function ProcureToPayPage({ initialTab = "memo" }: { initialTab?: ProcureTab }) {
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const memos = useProcurementStore((state) => state.memos);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);

  const [activeTab, setActiveTab] = useState<ProcureTab>(initialTab);
  const [detailState, setDetailState] = useState<DetailState>(null);
  const [previewState, setPreviewState] = useState<PreviewState>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
          if (memo.status === "Draft" || memo.status === "Revision Required" || memo.status === "Rejected") {
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
  const previewPr = previewState?.type === "pr" ? purchaseOrders.find((po) => po.id === previewState.id) ?? null : null;
  const previewPo = previewState?.type === "po" ? purchaseOrders.find((po) => po.id === previewState.id) ?? null : null;

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
    () =>
      purchaseOrders.filter((po) =>
        ["PO Created", "Sent to Vendor", "Pending Receiving", "Received"].includes(po.procurementStatus),
      ).length,
    [purchaseOrders],
  );

  const tabMeta = [
    { id: "memo" as const, label: "Memo", count: memoRequests.length, pendingCount: memoPendingCount },
    { id: "pr" as const, label: "PR", count: prItems.length, pendingCount: prPendingCount },
    { id: "po" as const, label: "PO", count: poItems.length, pendingCount: poPendingCount },
  ];
  const visibleTabs = tabMeta.filter((tab) => availableTabs.includes(tab.id));
  const currentTab = availableTabs.includes(activeTab) ? activeTab : availableTabs[0];

  const filteredMemoRequests = useMemo(
    () =>
      memoRequests.filter(
        (memo) => matchesMemoSearch(memo, searchTerm) && (statusFilter === "all" || memo.status === statusFilter),
      ),
    [memoRequests, searchTerm, statusFilter],
  );

  const filteredPrItems = useMemo(
    () =>
      prItems.filter(
        (po) => matchesPoSearch(po, searchTerm) && (statusFilter === "all" || po.procurementStatus === statusFilter),
      ),
    [prItems, searchTerm, statusFilter],
  );

  const filteredPoItems = useMemo(
    () =>
      poItems.filter(
        (po) => matchesPoSearch(po, searchTerm) && (statusFilter === "all" || po.procurementStatus === statusFilter),
      ),
    [poItems, searchTerm, statusFilter],
  );

  const statusOptions = useMemo(() => {
    const values =
      currentTab === "memo"
        ? memoRequests.map((memo) => memo.status)
        : currentTab === "pr"
          ? prItems.map((po) => po.procurementStatus)
          : poItems.map((po) => po.procurementStatus);
    return [...new Set(values)];
  }, [currentTab, memoRequests, poItems, prItems]);

  const hasBaseItems = currentTab === "memo" ? memoRequests.length > 0 : currentTab === "pr" ? prItems.length > 0 : poItems.length > 0;

  const openDetail = (type: "memo" | "pr" | "po", id: string) => {
    if (type !== activeTab) {
      setActiveTab(type);
    }
    setDetailState({ type, id });
  };

  const closeDetail = () => {
    setDetailState(null);
  };

  const openPreview = (type: "pr" | "po", id: string) => {
    setPreviewState({ type, id });
  };

  const closePreview = () => {
    setPreviewState(null);
  };

  const switchTab = (tab: ProcureTab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setStatusFilter("all");
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
    <div className="space-y-4">
      <PageHeader
        title="ระบบจัดซื้อจัดจ้าง"
        subtitle="รวม Memo, PR และ PO ในกระบวนการจัดซื้อ"
        className="px-5 py-6 sm:px-6"
        contentClassName="gap-3"
      />

      <section className={`${dashboardShellClass} p-4 sm:p-5`}>
        <div className="grid gap-3 md:grid-cols-3">
          {visibleTabs.map((tab) => (
            <SummaryTabCard
              key={tab.id}
              active={currentTab === tab.id}
              label={tab.label}
              count={tab.count}
              pendingCount={tab.pendingCount}
              onClick={() => switchTab(tab.id)}
            />
          ))}
        </div>

        <div className={`mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4 xl:flex-row xl:items-center xl:justify-between ${dashboardInnerCardClass} p-4`}>
          <div className="flex flex-1 flex-col gap-3 lg:flex-row">
            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`ค้นหา ${currentTab.toUpperCase()}...`}
                className={`${dashboardControlClass} w-full pl-9 pr-3 text-slate-900 placeholder:text-slate-400`}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${dashboardControlClass} w-full px-3 lg:w-56`}
            >
              <option value="all">ทุก Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {canCreateMemo ? (
            <Link
              href="/memo/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-[#007946] px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-[#00643a]"
            >
              <Plus className="h-4 w-4" /> Create Memo
            </Link>
          ) : null}
        </div>

        <div className="mt-4">
          {currentTab === "memo" ? (
            !hasBaseItems ? (
              <p className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มี Memo ที่ต้องดำเนินการสำหรับ Role นี้
              </p>
            ) : filteredMemoRequests.length === 0 ? (
              <p className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง
              </p>
            ) : (
              <DataTable
                headers={["เลขที่", "หัวข้อ", "ไซต์", "ยอดเงิน", "Status", ""]}
                className="border-[var(--border)] shadow-[var(--shadow-sm)]"
                headerClassName="bg-[rgba(244,249,246,0.96)]"
                headerCellClassName="px-4 py-3 text-xs font-semibold text-slate-500"
                bodyClassName="[&_td]:py-3"
                tableClassName="min-w-[920px]"
              >
                {filteredMemoRequests.map((memo) => (
                  <tr key={memo.id} className="border-t border-slate-100 transition hover:bg-[#fafdfb]">
                    <td className="px-4 text-slate-700">{memo.documentNumber}</td>
                    <td className="px-4 font-medium text-slate-900">{memo.title}</td>
                    <td className="px-4">{memo.site}</td>
                    <td className="px-4">{formatCurrency(memo.estimatedTotal)}</td>
                    <td className="px-4">
                      <StatusBadge label={memo.status} className="min-h-7 min-w-0 px-2.5 text-[11px]" />
                    </td>
                    <td className="px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {getMemoActionHref(memo.id) ? <ActionIconLink href={getMemoActionHref(memo.id) ?? "#"} icon={<Pencil className="h-4 w-4" />} title="แก้ไข" /> : null}
                        <ActionIconButton onClick={() => openDetail("memo", memo.id)} icon={<Eye className="h-4 w-4" />} title="ดูรายละเอียด" />
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )
          ) : null}

          {currentTab === "pr" ? (
            !hasBaseItems ? (
              <p className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มี PR ที่ต้องดำเนินการสำหรับ Role นี้
              </p>
            ) : filteredPrItems.length === 0 ? (
              <p className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง
              </p>
            ) : (
              <DataTable
                headers={["PR", "หัวข้อ", "ตัวเลือก Vendor", "Vendor ที่เลือก", "Status", ""]}
                className="border-[var(--border)] shadow-[var(--shadow-sm)]"
                headerClassName="bg-[rgba(244,249,246,0.96)]"
                headerCellClassName="px-4 py-3 text-xs font-semibold text-slate-500"
                bodyClassName="[&_td]:py-3"
                tableClassName="min-w-[1040px]"
              >
                {filteredPrItems.map((po) => (
                  <tr key={po.id} className="border-t border-slate-100 transition hover:bg-[#fafdfb]">
                    <td className="px-4 text-slate-700">{po.prNumber ?? po.documentNumber}</td>
                    <td className="px-4 font-medium text-slate-900">{po.memoTitle}</td>
                    <td className="px-4">{po.vendorProposals.length}</td>
                    <td className="px-4">{po.selectedVendorName ?? "-"}</td>
                    <td className="px-4">
                      <StatusBadge label={po.procurementStatus} className="min-h-7 min-w-0 px-2.5 text-[11px]" />
                    </td>
                    <td className="px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {getPrActionHref(po.id) ? <ActionIconLink href={getPrActionHref(po.id) ?? "#"} icon={<Pencil className="h-4 w-4" />} title="แก้ไข" /> : null}
                        <ActionIconButton onClick={() => openDetail("pr", po.id)} icon={<Eye className="h-4 w-4" />} title="ดูรายละเอียด" />
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )
          ) : null}

          {currentTab === "po" ? (
            !hasBaseItems ? (
              <p className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มี PO ที่ต้องดำเนินการสำหรับ Role นี้
              </p>
            ) : filteredPoItems.length === 0 ? (
              <p className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง
              </p>
            ) : (
              <DataTable
                headers={["PO", "หัวข้อ", "Vendor", "ยอดเงิน", "Status", ""]}
                className="border-[var(--border)] shadow-[var(--shadow-sm)]"
                headerClassName="bg-[rgba(244,249,246,0.96)]"
                headerCellClassName="px-4 py-3 text-xs font-semibold text-slate-500"
                bodyClassName="[&_td]:py-3"
                tableClassName="min-w-[1040px]"
              >
                {filteredPoItems.map((po) => (
                  <tr key={po.id} className="border-t border-slate-100 transition hover:bg-[#fafdfb]">
                    <td className="px-4 text-slate-700">{po.poNumber ?? po.documentNumber}</td>
                    <td className="px-4 font-medium text-slate-900">{po.memoTitle}</td>
                    <td className="px-4">{po.selectedVendorName ?? po.vendorName}</td>
                    <td className="px-4">{formatCurrency(po.amount)}</td>
                    <td className="px-4">
                      <StatusBadge label={po.procurementStatus} className="min-h-7 min-w-0 px-2.5 text-[11px]" />
                    </td>
                    <td className="px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionIconButton onClick={() => openDetail("po", po.id)} icon={<Eye className="h-4 w-4" />} title="ดูรายละเอียด" />
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )
          ) : null}
        </div>
      </section>

      {selectedMemo ? (
        <DetailModal title="รายละเอียด Memo" onClose={closeDetail}>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{selectedMemo.documentNumber}</p>
                <h3 className="mt-1.5 text-xl font-semibold text-slate-900">{selectedMemo.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  {selectedMemo.site} • {selectedMemo.department}
                </p>
              </div>
              <StatusBadge label={selectedMemo.status} className="min-h-7 min-w-0 px-2.5 text-[11px]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="วันที่ขอ" value={selectedMemo.requestDate} />
              <InfoCard label="วันที่ต้องการใช้" value={selectedMemo.requiredDate} />
              <InfoCard label="มูลค่าประมาณการ" value={formatCurrency(selectedMemo.estimatedTotal)} />
              <InfoCard label="สถานะจัดซื้อ" value={<StatusBadge label={selectedMemo.procurementStatus} className="min-h-7 min-w-0 px-2.5 text-[11px]" />} />
            </div>

            <div className={`${dashboardInnerCardClass} p-4`}>
              <p className="font-semibold text-slate-900">วัตถุประสงค์</p>
              <p className="mt-2 text-sm text-slate-600">{selectedMemo.purpose}</p>
            </div>

            <DataTable
              headers={["รายการ", "หมวด", "จำนวน", "มูลค่า"]}
              className="border-[var(--border)] shadow-[var(--shadow-sm)]"
              headerClassName="bg-[rgba(244,249,246,0.96)]"
              headerCellClassName="px-4 py-3 text-xs font-semibold text-slate-500"
              bodyClassName="[&_td]:py-3"
              tableClassName="min-w-[720px]"
            >
              {selectedMemo.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4">{getCategoryLabel(item.category)}</td>
                  <td className="px-4">
                    {item.quantity.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-4">{formatCurrency(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </DetailModal>
      ) : null}

      {selectedPr ? (
        <DetailModal title="รายละเอียด PR และการเสนอ Vendor" onClose={closeDetail}>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{selectedPr.prNumber ?? selectedPr.documentNumber}</p>
                <h3 className="mt-1.5 text-xl font-semibold text-slate-900">{selectedPr.memoTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  ผู้ขอซื้อ: {memoById.get(selectedPr.memoId)?.requesterName ?? "-"}
                </p>
              </div>
              <StatusBadge label={selectedPr.procurementStatus} className="min-h-7 min-w-0 px-2.5 text-[11px]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="เลขที่ PR" value={selectedPr.prNumber ?? selectedPr.documentNumber} />
              <InfoCard label="เลขที่ PO" value={selectedPr.poNumber ?? "-"} />
              <InfoCard label="มูลค่าปัจจุบัน" value={formatCurrency(selectedPr.amount)} />
              <InfoCard label="Vendor ที่เลือก" value={selectedPr.selectedVendorName ?? "-"} />
            </div>

            <div className={dashboardShellClass}>
              <div className="border-b border-[var(--border)] px-4 py-3">
                <p className="font-semibold text-slate-900">ตัวเลือก Vendor</p>
              </div>
              <div className="space-y-3 p-4">
                {selectedPr.vendorProposals.length === 0 ? (
                  <p className="text-sm text-slate-500">ยังไม่มีการเสนอ Vendor</p>
                ) : (
                  selectedPr.vendorProposals.map((proposal) => (
                    <div key={proposal.id} className={`${dashboardInnerCardClass} p-4`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-900">{proposal.vendorName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Lead time: {proposal.leadTime} • Payment terms: {proposal.paymentTerms}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">{proposal.notes}</p>
                          {proposal.attachmentName ? (
                            <p className="mt-2 text-sm text-sky-700">
                              เอกสารแนบ: {proposal.attachmentName}
                              {proposal.attachmentUrl ? ` (${proposal.attachmentUrl})` : ""}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-start gap-2.5 lg:items-end">
                          <p className="text-lg font-semibold text-slate-900">{formatCurrency(proposal.quotedPrice)}</p>
                          {proposal.submittedToApprover ? <StatusBadge label="Submitted" className="min-h-7 min-w-0 px-2.5 text-[11px]" /> : null}
                          {selectedPr.selectedVendorName === proposal.vendorName ? (
                            <StatusBadge label="Vendor Approved" className="min-h-7 min-w-0 px-2.5 text-[11px]" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`${dashboardInnerCardClass} p-4`}>
              <p className="font-semibold text-slate-900">ประวัติรายการ</p>
              <div className="mt-3 space-y-3">
                {selectedPr.history.length === 0 ? (
                  <p className="text-sm text-slate-500">ยังไม่มีประวัติ PR</p>
                ) : (
                  selectedPr.history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div key={`${entry.id}-${entry.date}-${entry.action}-${entry.actorId}-${index}`} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{entry.actionLabelTh}</p>
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

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openPreview("pr", selectedPr.id)}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <Download className="h-4 w-4" /> Download PR
              </button>
            </div>
          </div>
        </DetailModal>
      ) : null}

      {selectedPo ? (
        <DetailModal title="รายละเอียด PO" onClose={closeDetail}>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">{selectedPo.poNumber ?? selectedPo.documentNumber}</p>
                <h3 className="mt-1.5 text-xl font-semibold text-slate-900">{selectedPo.memoTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  Vendor: {selectedPo.selectedVendorName ?? selectedPo.vendorName}
                </p>
              </div>
              <StatusBadge label={selectedPo.procurementStatus} className="min-h-7 min-w-0 px-2.5 text-[11px]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="เลขที่ PO" value={selectedPo.poNumber ?? "-"} />
              <InfoCard label="เลขที่ PR" value={selectedPo.prNumber ?? selectedPo.documentNumber} />
              <InfoCard label="มูลค่า" value={formatCurrency(selectedPo.amount)} />
              <InfoCard label="Vendor" value={selectedPo.selectedVendorName ?? selectedPo.vendorName} />
            </div>

            <div className={`${dashboardInnerCardClass} p-4`}>
              <p className="font-semibold text-slate-900">ลำดับสถานะ PO</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["PO Created", "Sent to Vendor", "Pending Receiving", "Received", "QC Passed"].map((status) => (
                  <span
                    key={status}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      selectedPo.procurementStatus === status
                        ? "bg-[#007946] text-white"
                        : "border border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {getStatusLabel(status)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openPreview("po", selectedPo.id)}
                className="inline-flex h-11 items-center gap-2 rounded-[18px] bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <Download className="h-4 w-4" /> Download PO
              </button>
            </div>
          </div>
        </DetailModal>
      ) : null}

      {previewPr ? (
        <PreviewModal
          title="Preview PR Document"
          downloadLabel="Download PR"
          onClose={closePreview}
          onDownload={() => alert(mockSuccessText.pr)}
        >
          <PrDocumentPreview purchaseOrder={previewPr} memo={memoById.get(previewPr.memoId) ?? null} />
        </PreviewModal>
      ) : null}

      {previewPo ? (
        <PreviewModal
          title="Preview PO Document"
          downloadLabel="Download PO"
          onClose={closePreview}
          onDownload={() => alert(mockSuccessText.po)}
        >
          <PoDocumentPreview purchaseOrder={previewPo} memo={memoById.get(previewPo.memoId) ?? null} />
        </PreviewModal>
      ) : null}
    </div>
  );
}
