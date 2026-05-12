"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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
      className={`relative flex h-[80px] w-full items-start justify-between overflow-hidden rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-[#007946]/30 bg-[linear-gradient(180deg,#ffffff_0%,#f4fbf7_100%)] shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
          : "border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)] hover:border-[#007946]/20 hover:bg-[#fbfdfc]"
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
      <div className={`mt-0.5 h-8 w-8 rounded-lg border ${active ? "border-[#cce5d7] bg-[#f3fbf7]" : "border-slate-200 bg-slate-50"}`} />
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
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.14)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/25 hover:bg-[#f4fbf7] hover:text-[#007946]"
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#007946]/25 hover:bg-[#f4fbf7] hover:text-[#007946]"
    >
      {icon}
    </button>
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
        title="Procure-to-Pay"
        subtitle="รวม Memo, PR และ PO ในกระบวนการจัดซื้อ"
        className="rounded-xl px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
        contentClassName="gap-3"
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] sm:p-5">
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

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row">
            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`ค้นหา ${currentTab.toUpperCase()}...`}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:w-56"
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#007946] px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-[#00643a]"
            >
              <Plus className="h-4 w-4" /> Create Memo
            </Link>
          ) : null}
        </div>

        <div className="mt-4">
          {currentTab === "memo" ? (
            !hasBaseItems ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มี Memo ที่ต้องดำเนินการสำหรับ Role นี้
              </p>
            ) : filteredMemoRequests.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง
              </p>
            ) : (
              <DataTable
                headers={["เลขที่", "หัวข้อ", "ไซต์", "ยอดเงิน", "Status", ""]}
                className="rounded-xl border-slate-200 shadow-none"
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
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มี PR สำหรับ Role นี้
              </p>
            ) : filteredPrItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง
              </p>
            ) : (
              <DataTable
                headers={["PR", "หัวข้อ", "ตัวเลือก Vendor", "Vendor ที่เลือก", "Status", ""]}
                className="rounded-xl border-slate-200 shadow-none"
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
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มี PO ในช่วงนี้
              </p>
            ) : filteredPoItems.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรอง
              </p>
            ) : (
              <DataTable
                headers={["PO", "หัวข้อ", "Vendor", "ยอดเงิน", "Status", ""]}
                className="rounded-xl border-slate-200 shadow-none"
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">วัตถุประสงค์</p>
              <p className="mt-2 text-sm text-slate-600">{selectedMemo.purpose}</p>
            </div>

            <DataTable
              headers={["รายการ", "หมวด", "จำนวน", "มูลค่า"]}
              className="rounded-xl border-slate-200 shadow-none"
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

            <div className="rounded-xl border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-900">ตัวเลือก Vendor</p>
              </div>
              <div className="space-y-3 p-4">
                {selectedPr.vendorProposals.length === 0 ? (
                  <p className="text-sm text-slate-500">ยังไม่มีการเสนอ Vendor</p>
                ) : (
                  selectedPr.vendorProposals.map((proposal) => (
                    <div key={proposal.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">ประวัติรายการ</p>
              <div className="mt-3 space-y-3">
                {selectedPr.history.length === 0 ? (
                  <p className="text-sm text-slate-500">ยังไม่มีประวัติ PR</p>
                ) : (
                  selectedPr.history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div key={`${entry.id}-${entry.date}-${entry.action}-${entry.actorId}-${index}`} className="rounded-xl border border-slate-200/80 bg-white p-4">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                onClick={() => alert(`ดาวน์โหลด PO สำเร็จ (Mock)\nDocument: ${selectedPo.poNumber ?? selectedPo.documentNumber}`)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                <Download className="h-4 w-4" /> ดาวน์โหลด PO
              </button>
            </div>
          </div>
        </DetailModal>
      ) : null}
    </div>
  );
}
