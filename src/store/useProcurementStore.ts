import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import {
  initialStoreState,
  users,
  vendors,
} from "@/lib/mock-data";
import type {
  ApprovalHistory,
  MemoItem,
  MemoRequest,
  PaymentRequest,
  Role,
  ReceivingRecord,
  ProcurementState,
  POApprovalRequest,
} from "@/lib/types";

const getUserForRole = (role: Role) =>
  users.find((user) => user.role === role) ?? users[0];

const formatDocumentNumber = (prefix: string, index: number) =>
  `${prefix}-2026-${String(index).padStart(6, "0")}`;

const calculateTotal = (items: MemoItem[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const createHistoryEntry = (
  documentId: string,
  documentNumber: string,
  documentType: "Memo" | "PO",
  actorId: string,
  actorName: string,
  role: Role,
  action: ApprovalHistory["action"],
  comment: string,
): ApprovalHistory => ({
  id: `hist-${Date.now()}`,
  documentId,
  documentNumber,
  documentType,
  actorId,
  actorName,
  role,
  action,
  comment,
  date: new Date().toISOString(),
  actionLabelTh: 
    action === "Approved" ? "อนุมัติ" :
    action === "Rejected" ? "ไม่อนุมัติ" :
    action === "Revision Required" ? "ขอแก้ไข" :
    action === "Submitted" ? "ส่งขออนุมัติ" :
    "บันทึกร่าง",
});

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      ...initialStoreState,
      switchRole: (role) => {
        const user = getUserForRole(role);
        set({ currentRole: role, currentUserId: user.id });
      },
      createMemo: (memo) => {
        const state = get();
        const nextId = `memo-${state.memos.length + 1}`;
        const newMemo: MemoRequest = {
          id: nextId,
          documentNumber: formatDocumentNumber("MEMO", state.memos.length + 1),
          ...memo,
          requesterId: state.currentUserId,
          requesterName:
            state.users.find((user) => user.id === state.currentUserId)
              ?.name ?? "ทีมงาน",
          assignedApproverId: "u2",
          currentApproverName: "นางสาวปัทมา วัฒนสุข",
          status: "Draft",
          procurementStatus: "Not Started",
          estimatedTotal: calculateTotal(memo.items),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [
            createHistoryEntry(
              nextId,
              formatDocumentNumber("MEMO", state.memos.length + 1),
              "Memo",
              state.currentUserId,
              state.users.find((user) => user.id === state.currentUserId)?.name ?? "",
              state.users.find((user) => user.id === state.currentUserId)?.role ?? "Requester",
              "Draft Saved",
              "สร้างร่าง Memo",
            ),
          ],
        };
        set({ memos: [...state.memos, newMemo] });
      },
      saveDraft: (memoId, updates) => {
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  ...updates,
                  estimatedTotal: updates.items
                    ? calculateTotal(updates.items)
                    : memo.estimatedTotal,
                  updatedAt: new Date().toISOString(),
                }
              : memo,
          ),
        }));
      },
      submitMemo: (memoId) => {
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  status: "Pending Approval",
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...memo.history,
                    createHistoryEntry(
                      memo.id,
                      memo.documentNumber,
                      "Memo",
                      state.currentUserId,
                      state.users.find((user) => user.id === state.currentUserId)?.name ?? "",
                      state.users.find((user) => user.id === state.currentUserId)?.role ?? "Requester",
                      "Submitted",
                      "ส่งคำขอเพื่อขออนุมัติ",
                    ),
                  ],
                }
              : memo,
          ),
        }));
      },
      approveMemo: (memoId, comment) => {
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  status: "Approved",
                  procurementStatus: "PR Created",
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...memo.history,
                    createHistoryEntry(
                      memo.id,
                      memo.documentNumber,
                      "Memo",
                      state.currentUserId,
                      state.users.find((user) => user.id === state.currentUserId)?.name ?? "",
                      state.users.find((user) => user.id === state.currentUserId)?.role ?? "Approver",
                      "Approved",
                      comment || "อนุมัติคำขอ",
                    ),
                  ],
                }
              : memo,
          ),
          purchaseOrders: [
            ...state.purchaseOrders,
            {
              id: `po-${state.purchaseOrders.length + 1}`,
              documentNumber: formatDocumentNumber("PR", state.purchaseOrders.length + 1),
              memoId,
              memoTitle:
                state.memos.find((memo) => memo.id === memoId)?.title ?? "",
              vendorId: null,
              vendorName: "รอเลือกผู้ขาย",
              procurementStatus: "PR Created",
              amount:
                state.memos.find((memo) => memo.id === memoId)
                  ?.estimatedTotal ?? 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
      },
      rejectMemo: (memoId, comment) => {
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  status: "Rejected",
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...memo.history,
                    createHistoryEntry(
                      memo.id,
                      memo.documentNumber,
                      "Memo",
                      state.currentUserId,
                      state.users.find((user) => user.id === state.currentUserId)?.name ?? "",
                      state.users.find((user) => user.id === state.currentUserId)?.role ?? "Approver",
                      "Rejected",
                      comment || "ไม่อนุมัติคำขอ",
                    ),
                  ],
                }
              : memo,
          ),
        }));
      },
      requestRevision: (memoId, comment) => {
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  status: "Revision Required",
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...memo.history,
                    createHistoryEntry(
                      memo.id,
                      memo.documentNumber,
                      "Memo",
                      state.currentUserId,
                      state.users.find((user) => user.id === state.currentUserId)?.name ?? "",
                      state.users.find((user) => user.id === state.currentUserId)?.role ?? "Approver",
                      "Revision Required",
                      comment || "ขอแก้ไขข้อมูล",
                    ),
                  ],
                }
              : memo,
          ),
        }));
      },
      createPR: (memoId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.memoId === memoId
              ? {
                  ...po,
                  procurementStatus: "PR Created",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  procurementStatus: "PR Created",
                  status: "Converted to PR",
                  updatedAt: new Date().toISOString(),
                }
              : memo,
          ),
        }));
      },
      selectVendor: (poId, vendorId) => {
        const vendor = vendors.find((item) => item.id === vendorId);
        const state = get();
        const po = state.purchaseOrders.find((item) => item.id === poId);
        const amount = po?.amount ?? 0;
        const requiresApproval = amount > 50000; // 50K THB threshold
        
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  vendorId,
                  vendorName: vendor?.name ?? po.vendorName,
                  selectedVendorId: vendorId,
                  poApprovalRequired: requiresApproval,
                  procurementStatus: "Vendor Selected",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      createPO: (poId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  procurementStatus: "PO Created",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      sendPOForApproval: (poId) => {
        const state = get();
        const po = state.purchaseOrders.find((item) => item.id === poId);
        const memo = state.memos.find((item) => item.id === po?.memoId);
        
        if (!po || !memo) return;
        
        const poApprovalRequest: POApprovalRequest = {
          id: `po-approval-${state.poApprovalRequests.length + 1}`,
          documentNumber: po.documentNumber,
          poId,
          vendorName: po.vendorName,
          amount: po.amount,
          assignedApproverId: "u3",
          assignedApproverName: "นายสมชาย ลิ่มธรรม",
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          reason: memo.title,
          history: [],
        };
        
        set((state) => ({
          poApprovalRequests: [...state.poApprovalRequests, poApprovalRequest],
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  procurementStatus: "Pending PO Approval",
                  poApprovalStatus: "Pending",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      approvePO: (poApprovalId, comment) => {
        const state = get();
        const poApproval = state.poApprovalRequests.find((item) => item.id === poApprovalId);
        
        if (!poApproval) return;
        
        const currentUser = state.users.find((user) => user.id === state.currentUserId);
        
        set((state) => ({
          poApprovalRequests: state.poApprovalRequests.map((item) =>
            item.id === poApprovalId
              ? {
                  ...item,
                  status: "Approved",
                  poApprovalStatus: "Approved",
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...item.history,
                    createHistoryEntry(
                      item.poId,
                      item.documentNumber,
                      "PO",
                      state.currentUserId,
                      currentUser?.name ?? "User",
                      currentUser?.role ?? "Approver",
                      "Approved",
                      comment || "อนุมัติ PO",
                    ),
                  ],
                }
              : item,
          ),
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poApproval.poId
              ? {
                  ...po,
                  procurementStatus: "PO Approved",
                  poApprovalStatus: "Approved",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      rejectPO: (poApprovalId, comment) => {
        const state = get();
        const poApproval = state.poApprovalRequests.find((item) => item.id === poApprovalId);
        
        if (!poApproval) return;
        
        const currentUser = state.users.find((user) => user.id === state.currentUserId);
        
        set((state) => ({
          poApprovalRequests: state.poApprovalRequests.map((item) =>
            item.id === poApprovalId
              ? {
                  ...item,
                  status: "Rejected",
                  poApprovalStatus: "Rejected",
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...item.history,
                    createHistoryEntry(
                      item.poId,
                      item.documentNumber,
                      "PO",
                      state.currentUserId,
                      currentUser?.name ?? "User",
                      currentUser?.role ?? "Approver",
                      "Rejected",
                      comment || "ไม่อนุมัติ PO",
                    ),
                  ],
                }
              : item,
          ),
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poApproval.poId
              ? {
                  ...po,
                  procurementStatus: "PO Rejected",
                  poApprovalStatus: "Rejected",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      sendToVendor: (poId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  procurementStatus: "Sent to Vendor",
                  sentToVendorAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      receivePo: (poId, record) => {
        const po = get().purchaseOrders.find((item) => item.id === poId);
        if (!po) return;
        const existing = get().receivingRecords.find((item) => item.poId === poId);
        const newRecord: ReceivingRecord = {
          id: existing?.id ?? `recv-${get().receivingRecords.length + 1}`,
          poId,
          poNumber: po.documentNumber,
          vendorName: po.vendorName,
          deliveryDate: record.deliveryDate ?? new Date().toISOString(),
          receivedQty: record.receivedQty ?? 0,
          condition: record.condition ?? "Good",
          lotNumber: record.lotNumber ?? "-",
          batchNumber: record.batchNumber ?? "-",
          expiryDate: record.expiryDate ?? new Date().toISOString().slice(0, 10),
          coaMsds: record.coaMsds ?? false,
          qcRequired: record.qcRequired ?? true,
          qcStatus: record.qcStatus ?? "Pending QC",
          notes: record.notes ?? "รับสินค้าเพื่อรอตรวจสอบ",
        };
        set((state) => ({
          receivingRecords: state.receivingRecords.filter((item) => item.poId !== poId).concat(newRecord),
          purchaseOrders: state.purchaseOrders.map((item) =>
            item.id === poId
              ? {
                  ...item,
                  procurementStatus: record.qcRequired ? "QC Pending" : "Receiving",
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        }));
      },
      markQcPassed: (poId) => {
        const state = get();
        const po = state.purchaseOrders.find((item) => item.id === poId);
        if (!po) return;
        const existingPayment = state.paymentRequests.find((item) => item.poId === poId);
        const receiving = state.receivingRecords.find((item) => item.poId === poId);
        const receivingAmount = receiving?.receivedQty ?? 0;
        const paymentRequest: PaymentRequest =
          existingPayment ?? {
            id: `pay-${state.paymentRequests.length + 1}`,
            poId,
            poNumber: po.documentNumber,
            vendorName: po.vendorName,
            invoiceAmount: po.amount,
            receivingAmount,
            status: "Ready for AP Posting",
            invoiceUploaded: true,
            createdAt: new Date().toISOString(),
          };
        set({
          receivingRecords: state.receivingRecords.map((item) =>
            item.poId === poId
              ? {
                  ...item,
                  qcStatus: "QC Passed",
                }
              : item,
          ),
          purchaseOrders: state.purchaseOrders.map((item) =>
            item.id === poId
              ? {
                  ...item,
                  procurementStatus: "QC Passed",
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
          paymentRequests: existingPayment
            ? state.paymentRequests.map((item) =>
                item.poId === poId
                  ? {
                      ...item,
                      status: "Ready for AP Posting",
                    }
                  : item,
              )
            : [...state.paymentRequests, paymentRequest],
        });
      },
      updatePaymentStatus: (poId, status) => {
        set((state) => ({
          paymentRequests: state.paymentRequests.map((item) =>
            item.poId === poId
              ? {
                  ...item,
                  status,
                }
              : item,
          ),
        }));
      },
    }),
    {
      name: "ht-procurement-store",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
    },
  ),
);
