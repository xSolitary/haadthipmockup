import type { MemoRequest, PurchaseOrder } from "@/lib/types";
import { getStatusLabel } from "@/lib/ui-text";

export type ProcureToPaySortOption =
  | "latest"
  | "oldest"
  | "document"
  | "status"
  | "amount-desc"
  | "amount-asc";

function compareText(a: string, b: string) {
  return a.localeCompare(b, "th");
}

function compareDate(a?: string, b?: string, direction: "asc" | "desc" = "desc") {
  const left = a ? new Date(a).getTime() : 0;
  const right = b ? new Date(b).getTime() : 0;

  return direction === "asc" ? left - right : right - left;
}

function getPoTimestamp(po: PurchaseOrder) {
  return po.vendorUpdatedAt ?? po.updatedAt;
}

export function getPoDisplayStatus(po: PurchaseOrder) {
  if (po.vendorDeliveryStatus) {
    return po.vendorDeliveryStatus;
  }

  if (po.procurementStatus === "Pending Receiving") {
    return "รอรับสินค้า";
  }

  if (po.procurementStatus === "QC Passed") {
    return "ผ่าน QC";
  }

  return null;
}

export function matchesMemoSearch(memo: MemoRequest, searchTerm: string) {
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

export function matchesPoSearch(po: PurchaseOrder, searchTerm: string) {
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
    po.vendorDeliveryStatus ?? "",
    po.trackingNumber ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function filterMemoRequests(memos: MemoRequest[], searchTerm: string, statusFilter: string) {
  return memos.filter(
    (memo) => matchesMemoSearch(memo, searchTerm) && (statusFilter === "all" || memo.status === statusFilter),
  );
}

export function filterPrItems(purchaseOrders: PurchaseOrder[], searchTerm: string, statusFilter: string) {
  return purchaseOrders.filter(
    (po) => matchesPoSearch(po, searchTerm) && (statusFilter === "all" || po.procurementStatus === statusFilter),
  );
}

export function filterPoItems(purchaseOrders: PurchaseOrder[], searchTerm: string, statusFilter: string) {
  return purchaseOrders.filter(
    (po) =>
      matchesPoSearch(po, searchTerm) &&
      (statusFilter === "all" || getPoDisplayStatus(po) === statusFilter || po.procurementStatus === statusFilter),
  );
}

export function sortMemoRequests(memos: MemoRequest[], sortOption: ProcureToPaySortOption) {
  return [...memos].sort((a, b) => {
    switch (sortOption) {
      case "oldest":
        return compareDate(a.updatedAt, b.updatedAt, "asc");
      case "document":
        return compareText(a.documentNumber, b.documentNumber);
      case "status":
        return compareText(getStatusLabel(a.status), getStatusLabel(b.status));
      case "amount-desc":
        return b.estimatedTotal - a.estimatedTotal;
      case "amount-asc":
        return a.estimatedTotal - b.estimatedTotal;
      case "latest":
      default:
        return compareDate(a.updatedAt, b.updatedAt, "desc");
    }
  });
}

export function sortPrItems(
  purchaseOrders: PurchaseOrder[],
  memoById: ReadonlyMap<string, MemoRequest>,
  sortOption: ProcureToPaySortOption,
) {
  return [...purchaseOrders].sort((a, b) => {
    const leftAmount = memoById.get(a.memoId)?.estimatedTotal ?? a.amount;
    const rightAmount = memoById.get(b.memoId)?.estimatedTotal ?? b.amount;

    switch (sortOption) {
      case "oldest":
        return compareDate(a.updatedAt, b.updatedAt, "asc");
      case "document":
        return compareText(a.prNumber ?? a.documentNumber, b.prNumber ?? b.documentNumber);
      case "status":
        return compareText(getStatusLabel(a.procurementStatus), getStatusLabel(b.procurementStatus));
      case "amount-desc":
        return rightAmount - leftAmount;
      case "amount-asc":
        return leftAmount - rightAmount;
      case "latest":
      default:
        return compareDate(a.updatedAt, b.updatedAt, "desc");
    }
  });
}

export function sortPoItems(purchaseOrders: PurchaseOrder[], sortOption: ProcureToPaySortOption) {
  return [...purchaseOrders].sort((a, b) => {
    switch (sortOption) {
      case "oldest":
        return compareDate(getPoTimestamp(a), getPoTimestamp(b), "asc");
      case "document":
        return compareText(a.poNumber ?? a.documentNumber, b.poNumber ?? b.documentNumber);
      case "status":
        return compareText(
          getStatusLabel(getPoDisplayStatus(a) ?? a.procurementStatus),
          getStatusLabel(getPoDisplayStatus(b) ?? b.procurementStatus),
        );
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "latest":
      default:
        return compareDate(getPoTimestamp(a), getPoTimestamp(b), "desc");
    }
  });
}
