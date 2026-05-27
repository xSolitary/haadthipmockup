import { describe, expect, it } from "vitest";
import {
  filterMemoRequests,
  filterPoItems,
  filterPrItems,
  getPoDisplayStatus,
  sortMemoRequests,
  sortPoItems,
  sortPrItems,
} from "@/lib/procure-to-pay";
import type { MemoRequest, PurchaseOrder } from "@/lib/types";

function createMemo(overrides: Partial<MemoRequest> = {}): MemoRequest {
  return {
    id: "memo-1",
    documentNumber: "MEMO-2026-000001",
    requesterId: "u1",
    requesterName: "Requester",
    department: "Production",
    site: "Hat Yai Plant",
    costCenter: "CC-01",
    requestDate: "2026-05-20",
    requiredDate: "2026-05-25",
    title: "Bottle caps",
    category: "Packaging",
    purpose: "Test",
    urgency: "Normal",
    budgetCode: "BUD-01",
    deliveryLocation: "Warehouse",
    items: [],
    attachments: [],
    budgetRemaining: 1000,
    status: "Pending Approval",
    procurementStatus: "Not Started",
    assignedApproverId: "u2",
    currentApproverName: "Approver",
    estimatedTotal: 1000,
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T10:00:00.000Z",
    history: [],
    ...overrides,
  };
}

function createPurchaseOrder(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: "po-1",
    documentNumber: "PR-2026-000001",
    memoId: "memo-1",
    memoTitle: "Bottle caps",
    vendorId: null,
    vendorName: "Vendor A",
    procurementStatus: "Pending Vendor Approval",
    amount: 1000,
    createdAt: "2026-05-20T09:00:00.000Z",
    updatedAt: "2026-05-20T11:00:00.000Z",
    vendorProposals: [],
    history: [],
    prNumber: "PR-2026-000001",
    poNumber: "PO-2026-000001",
    ...overrides,
  };
}

describe("procure-to-pay helpers", () => {
  it("filters memo requests by search term and status", () => {
    const memos = [
      createMemo(),
      createMemo({
        id: "memo-2",
        documentNumber: "MEMO-2026-000002",
        title: "Office paper",
        status: "Approved",
      }),
    ];

    expect(filterMemoRequests(memos, "office", "Approved").map((memo) => memo.id)).toEqual(["memo-2"]);
    expect(filterMemoRequests(memos, "caps", "Pending Approval").map((memo) => memo.id)).toEqual(["memo-1"]);
  });

  it("filters PR items by search term and procurement status", () => {
    const purchaseOrders = [
      createPurchaseOrder(),
      createPurchaseOrder({
        id: "po-2",
        memoTitle: "Office paper",
        procurementStatus: "PO Created",
      }),
    ];

    expect(filterPrItems(purchaseOrders, "office", "PO Created").map((po) => po.id)).toEqual(["po-2"]);
  });

  it("derives PO display status from vendor delivery state or receiving milestones", () => {
    expect(
      getPoDisplayStatus(createPurchaseOrder({ procurementStatus: "Pending Receiving", vendorDeliveryStatus: undefined })),
    ).toBe("รอรับสินค้า");
    expect(getPoDisplayStatus(createPurchaseOrder({ procurementStatus: "QC Passed" }))).toBe("ผ่าน QC");
  });

  it("filters PO items by derived delivery status", () => {
    const purchaseOrders = [
      createPurchaseOrder({ procurementStatus: "Pending Receiving", vendorDeliveryStatus: undefined }),
      createPurchaseOrder({
        id: "po-2",
        procurementStatus: "Sent to Vendor",
        vendorDeliveryStatus: "อยู่ระหว่างจัดส่ง",
      }),
    ];

    expect(filterPoItems(purchaseOrders, "", "รอรับสินค้า").map((po) => po.id)).toEqual(["po-1"]);
    expect(filterPoItems(purchaseOrders, "", "อยู่ระหว่างจัดส่ง").map((po) => po.id)).toEqual(["po-2"]);
  });

  it("sorts memo requests by amount ascending", () => {
    const memos = [
      createMemo({ id: "memo-1", estimatedTotal: 3000 }),
      createMemo({ id: "memo-2", documentNumber: "MEMO-2026-000002", estimatedTotal: 1000 }),
    ];

    expect(sortMemoRequests(memos, "amount-asc").map((memo) => memo.id)).toEqual(["memo-2", "memo-1"]);
  });

  it("sorts PR items by memo total when requested", () => {
    const purchaseOrders = [
      createPurchaseOrder({ id: "po-1", memoId: "memo-1", amount: 900 }),
      createPurchaseOrder({ id: "po-2", memoId: "memo-2", amount: 900 }),
    ];
    const memoById = new Map([
      ["memo-1", createMemo({ id: "memo-1", estimatedTotal: 3000 })],
      ["memo-2", createMemo({ id: "memo-2", estimatedTotal: 1000 })],
    ]);

    expect(sortPrItems(purchaseOrders, memoById, "amount-asc").map((po) => po.id)).toEqual(["po-2", "po-1"]);
  });

  it("sorts PO items by latest vendor update when present", () => {
    const purchaseOrders = [
      createPurchaseOrder({ id: "po-1", vendorUpdatedAt: "2026-05-20T10:00:00.000Z" }),
      createPurchaseOrder({ id: "po-2", vendorUpdatedAt: "2026-05-22T10:00:00.000Z" }),
    ];

    expect(sortPoItems(purchaseOrders, "latest").map((po) => po.id)).toEqual(["po-2", "po-1"]);
  });
});
