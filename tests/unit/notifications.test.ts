import { describe, expect, it } from "vitest";
import { getActionNotifications } from "@/lib/notifications";
import type { MemoRequest, PaymentRequest, PurchaseOrder } from "@/lib/types";

function createMemo(overrides: Partial<MemoRequest> = {}): MemoRequest {
  return {
    id: "memo-1",
    documentNumber: "MEMO-2026-000001",
    requesterId: "u-requester",
    requesterName: "Requester",
    department: "Production",
    site: "Hat Yai Plant",
    costCenter: "CC-01",
    requestDate: "2026-05-20",
    requiredDate: "2026-05-25",
    title: "Memo Title",
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
    assignedApproverId: "u-approver",
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
    memoTitle: "Memo Title",
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

describe("notifications", () => {
  it("builds approver notifications for memo approvals and vendor approvals", () => {
    const notifications = getActionNotifications({
      currentRole: "Approver",
      currentUserId: "u-approver",
      memos: [createMemo()],
      purchaseOrders: [createPurchaseOrder()],
      paymentRequests: [],
    });

    expect(notifications.map((item) => item.id)).toEqual([
      "vendor-approval-po-1",
      "memo-approval-memo-1",
    ]);
  });

  it("counts separate vendor notifications for a new PO and its follow-up state", () => {
    const notifications = getActionNotifications({
      currentRole: "Vendor",
      currentUserId: "u-vendor",
      memos: [],
      purchaseOrders: [
        createPurchaseOrder({
          procurementStatus: "PO Created",
          selectedVendorName: "Vendor A",
          updatedAt: "2026-05-21T09:00:00.000Z",
        }),
      ],
      paymentRequests: [],
    });

    expect(notifications.map((item) => item.id)).toEqual([
      "vendor-new-po-po-1",
      "vendor-followup-po-1",
    ]);
  });

  it("returns no notifications without an authenticated role context", () => {
    expect(
      getActionNotifications({
        currentRole: null,
        currentUserId: "",
        memos: [],
        purchaseOrders: [],
        paymentRequests: [] satisfies PaymentRequest[],
      }),
    ).toEqual([]);
  });
});
