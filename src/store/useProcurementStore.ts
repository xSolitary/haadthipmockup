import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import { defaultRole, defaultUserId, initialStoreState, users, vendors } from "@/lib/mock-data";
import type {
  ApprovalHistory,
  MemoItem,
  MemoRequest,
  PaymentRequest,
  ProcurementState,
  PurchaseOrder,
  ReceivingRecord,
  Role,
  VendorProposal,
} from "@/lib/types";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const allowedLoginRoles: Array<Extract<Role, "Requester" | "Approver" | "Purchasing">> = [
  "Requester",
  "Approver",
  "Purchasing",
];

const getUserForRole = (role: Role) => users.find((user) => user.role === role) ?? users[0];

const formatDocumentNumber = (prefix: string, index: number) =>
  `${prefix}-2026-${String(index).padStart(6, "0")}`;

const calculateTotal = (items: MemoItem[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

const createHistoryEntry = (
  documentId: string,
  documentNumber: string,
  documentType: "Memo" | "PR" | "PO",
  actorId: string,
  actorName: string,
  role: Role,
  action: ApprovalHistory["action"],
  comment: string,
): ApprovalHistory => ({
  id: `hist-${crypto.randomUUID()}`,
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
    action === "Approved"
      ? "อนุมัติ"
      : action === "Rejected"
        ? "ไม่อนุมัติ"
        : action === "Revision Required"
          ? "ขอแก้ไข"
          : action === "Submitted"
            ? "ส่งขออนุมัติ"
            : action === "Resubmitted"
              ? "ส่งแก้ไขใหม่"
            : action === "Vendor Proposed"
              ? "เสนอ vendor"
              : action === "Submitted for Vendor Approval"
                ? "ส่งอนุมัติ vendor"
                : action === "Vendor Confirmed"
                  ? "ยืนยัน vendor"
                  : "บันทึกร่าง",
});

function normalizePurchaseOrder(po: PurchaseOrder, receiving?: ReceivingRecord): PurchaseOrder {
  let procurementStatus = po.procurementStatus;

  if (procurementStatus === "PR Created") {
    procurementStatus = "Waiting for Purchasing to Propose Vendors";
  } else if (procurementStatus === "Vendor Selected" || procurementStatus === "Pending PO Approval") {
    procurementStatus = "Pending Vendor Approval";
  } else if (procurementStatus === "PO Approved") {
    procurementStatus = "PO Created";
  } else if (procurementStatus === "Receiving" || procurementStatus === "QC Pending") {
    procurementStatus = receiving?.qcStatus === "QC Passed" ? "QC Passed" : "Received";
  }

  if (receiving?.qcStatus === "QC Passed") {
    procurementStatus = "QC Passed";
  } else if (receiving && procurementStatus !== "QC Passed") {
    procurementStatus = "Received";
  }

  return {
    ...po,
    vendorProposals: (po.vendorProposals ?? []).map((proposal) => ({
      ...proposal,
      submittedToApprover: proposal.submittedToApprover ?? false,
    })),
    history: po.history ?? [],
    selectedVendorName: po.selectedVendorName ?? po.vendorName,
    procurementStatus,
  };
}

function updateMemoFields(memo: MemoRequest, updates: Partial<MemoRequest>): MemoRequest {
  return {
    ...memo,
    ...updates,
    estimatedTotal: updates.items ? calculateTotal(updates.items) : memo.estimatedTotal,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeState(state: ProcurementState): ProcurementState {
  const receivingByPoId = new Map(state.receivingRecords.map((record) => [record.poId, record]));
  const purchaseOrders = state.purchaseOrders.map((po) => normalizePurchaseOrder(po, receivingByPoId.get(po.id)));

  return {
    ...state,
    currentRole: state.currentRole ?? defaultRole,
    currentUserId: state.currentUserId ?? defaultUserId,
    isAuthenticated: Boolean(state.isAuthenticated),
    purchaseOrders,
    approvalHistory: state.approvalHistory ?? [],
    poApprovalRequests: state.poApprovalRequests ?? [],
  };
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      ...normalizeState(initialStoreState as unknown as ProcurementState),
      loginAsRole: (role) => {
        const user = getUserForRole(role);
        set({
          currentRole: role,
          currentUserId: user.id,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          currentRole: defaultRole,
          currentUserId: defaultUserId,
          isAuthenticated: false,
        });
      },
      switchRole: (role) => {
        const user = getUserForRole(role);
        set({
          currentRole: role,
          currentUserId: user.id,
          isAuthenticated: allowedLoginRoles.includes(role as Extract<Role, "Requester" | "Approver" | "Purchasing">),
        });
      },
      createMemo: (memo) => {
        const state = get();
        const nextId = `memo-${state.memos.length + 1}`;
        const documentNumber = formatDocumentNumber("MEMO", state.memos.length + 1);
        const currentUser = state.users.find((user) => user.id === state.currentUserId);
        const newMemo: MemoRequest = {
          id: nextId,
          documentNumber,
          ...memo,
          requesterId: state.currentUserId,
          requesterName: currentUser?.name ?? "ทีมงาน",
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
              documentNumber,
              "Memo",
              state.currentUserId,
              currentUser?.name ?? "",
              currentUser?.role ?? "Requester",
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
            memo.id === memoId ? updateMemoFields(memo, updates) : memo,
          ),
        }));
      },
      updateMemo: (memoId, updates) => {
        set((state) => ({
          memos: state.memos.map((memo) =>
            memo.id === memoId ? updateMemoFields(memo, updates) : memo,
          ),
        }));
      },
      submitMemo: (memoId) => {
        set((state) => ({
          memos: state.memos.map((memo) => {
            if (memo.id !== memoId) return memo;

            const currentUser = state.users.find((user) => user.id === state.currentUserId);

            return {
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
                  currentUser?.name ?? "",
                  currentUser?.role ?? "Requester",
                  "Submitted",
                  "ส่งคำขอเพื่อขออนุมัติ",
                ),
              ],
            };
          }),
        }));
      },
      resubmitMemo: (memoId, updates) => {
        set((state) => ({
          memos: state.memos.map((memo) => {
            if (memo.id !== memoId) return memo;

            const currentUser = state.users.find((user) => user.id === state.currentUserId);

            return {
              ...updateMemoFields(memo, updates),
              status: "Pending Approval",
              history: [
                ...memo.history,
                createHistoryEntry(
                  memo.id,
                  memo.documentNumber,
                  "Memo",
                  state.currentUserId,
                  currentUser?.name ?? "",
                  currentUser?.role ?? "Requester",
                  "Resubmitted",
                  "แก้ไขและส่งคำขออีกครั้ง",
                ),
              ],
            };
          }),
        }));
      },
      approveMemo: (memoId, comment) => {
        const state = get();
        const currentUser = state.users.find((user) => user.id === state.currentUserId);
        const nextIndex = state.purchaseOrders.length + 1;
        const prNumber = formatDocumentNumber("PR", nextIndex);
        const poNumber = formatDocumentNumber("PO", nextIndex);
        const memo = state.memos.find((item) => item.id === memoId);

        if (!memo) return;

        const purchaseOrder: PurchaseOrder = {
          id: `po-${nextIndex}`,
          documentNumber: prNumber,
          memoId,
          memoTitle: memo.title,
          vendorId: null,
          vendorName: "Awaiting vendor proposal",
          procurementStatus: "Waiting for Purchasing to Propose Vendors",
          amount: memo.estimatedTotal,
          prNumber,
          poNumber,
          poApprovalRequired: false,
          poApprovalStatus: undefined,
          selectedVendorId: undefined,
          selectedVendorName: undefined,
          vendorProposals: [],
          history: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          memos: state.memos.map((item) =>
            item.id === memoId
              ? {
                  ...item,
                  status: "Approved",
                  procurementStatus: "Waiting for Purchasing to Propose Vendors",
                  prNumber,
                  poNumber,
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...item.history,
                    createHistoryEntry(
                      item.id,
                      item.documentNumber,
                      "Memo",
                      state.currentUserId,
                      currentUser?.name ?? "",
                      currentUser?.role ?? "Approver",
                      "Approved",
                      comment || "อนุมัติคำขอ",
                    ),
                  ],
                }
              : item,
          ),
          purchaseOrders: [...state.purchaseOrders, purchaseOrder],
        });
      },
      rejectMemo: (memoId, comment) => {
        set((state) => ({
          memos: state.memos.map((memo) => {
            if (memo.id !== memoId) return memo;

            const currentUser = state.users.find((user) => user.id === state.currentUserId);

            return {
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
                  currentUser?.name ?? "",
                  currentUser?.role ?? "Approver",
                  "Rejected",
                  comment || "ไม่อนุมัติคำขอ",
                ),
              ],
            };
          }),
        }));
      },
      requestRevision: (memoId, comment) => {
        set((state) => ({
          memos: state.memos.map((memo) => {
            if (memo.id !== memoId) return memo;

            const currentUser = state.users.find((user) => user.id === state.currentUserId);

            return {
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
                  currentUser?.name ?? "",
                  currentUser?.role ?? "Approver",
                  "Revision Required",
                  comment || "ขอแก้ไขข้อมูล",
                ),
              ],
            };
          }),
        }));
      },
      createPR: (memoId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.memoId === memoId
              ? {
                  ...po,
                  procurementStatus: "Waiting for Purchasing to Propose Vendors",
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
          memos: state.memos.map((memo) =>
            memo.id === memoId
              ? {
                  ...memo,
                  procurementStatus: "Waiting for Purchasing to Propose Vendors",
                  status: "Converted to PR",
                  prNumber: memo.prNumber ?? formatDocumentNumber("PR", state.purchaseOrders.length + 1),
                  poNumber: memo.poNumber ?? formatDocumentNumber("PO", state.purchaseOrders.length + 1),
                  updatedAt: new Date().toISOString(),
                }
              : memo,
          ),
        }));
      },
      addVendorProposal: (poId, proposal) => {
        const state = get();
        const currentUser = state.users.find((user) => user.id === state.currentUserId);

        if (!currentUser) return;

        set({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id !== poId) return po;

            const nextProposal: VendorProposal = {
              ...proposal,
              id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              submittedToApprover: proposal.submittedToApprover ?? false,
              proposedById: currentUser.id,
              proposedByName: currentUser.name,
              createdAt: new Date().toISOString(),
            };

            return {
              ...po,
              vendorProposals: [...po.vendorProposals, nextProposal],
              procurementStatus:
                po.procurementStatus === "Waiting for Purchasing to Propose Vendors"
                  ? "Waiting for Purchasing to Propose Vendors"
                  : po.procurementStatus,
              history: [
                ...po.history,
                createHistoryEntry(
                  po.id,
                  po.prNumber ?? po.documentNumber,
                  "PR",
                  currentUser.id,
                  currentUser.name,
                  currentUser.role,
                  "Vendor Proposed",
                  `เพิ่ม vendor option: ${proposal.vendorName}`,
                ),
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },
      updateVendorProposal: (poId, proposalId, updates) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  vendorProposals: po.vendorProposals.map((proposal) =>
                    proposal.id === proposalId
                      ? {
                          ...proposal,
                          ...updates,
                          submittedToApprover: updates.submittedToApprover ?? proposal.submittedToApprover,
                        }
                      : proposal,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      deleteVendorProposal: (poId, proposalId) => {
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  vendorProposals: po.vendorProposals.filter((proposal) => proposal.id !== proposalId),
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
        }));
      },
      submitVendorProposals: (poId, proposalIds) => {
        const state = get();
        const currentUser = state.users.find((user) => user.id === state.currentUserId);

        if (!currentUser || proposalIds.length === 0) return;

        set({
          purchaseOrders: state.purchaseOrders.map((po) => {
            if (po.id !== poId || po.vendorProposals.length === 0) return po;

            return {
              ...po,
              vendorProposals: po.vendorProposals.map((proposal) => ({
                ...proposal,
                submittedToApprover: proposalIds.includes(proposal.id),
              })),
              procurementStatus: "Pending Vendor Approval",
              history: [
                ...po.history,
                createHistoryEntry(
                  po.id,
                  po.prNumber ?? po.documentNumber,
                  "PR",
                  currentUser.id,
                  currentUser.name,
                  currentUser.role,
                  "Submitted for Vendor Approval",
                  `ส่ง vendor options ${proposalIds.length} รายการให้ approver ตัดสินใจ`,
                ),
              ],
              updatedAt: new Date().toISOString(),
            };
          }),
          memos: state.memos.map((memo) => {
            const relatedPo = state.purchaseOrders.find((po) => po.id === poId);
            return memo.id === relatedPo?.memoId
              ? {
                  ...memo,
                  procurementStatus: "Pending Vendor Approval",
                  updatedAt: new Date().toISOString(),
                }
              : memo;
          }),
        });
      },
      approveVendorSelection: (poId, proposalId, comment) => {
        const state = get();
        const currentUser = state.users.find((user) => user.id === state.currentUserId);
        const targetPo = state.purchaseOrders.find((po) => po.id === poId);
        const proposal = targetPo?.vendorProposals.find((item) => item.id === proposalId);

        if (!currentUser || !targetPo || !proposal) return;

        set({
          purchaseOrders: state.purchaseOrders.map((po) =>
            po.id === poId
              ? {
                  ...po,
                  vendorId: proposal.vendorId ?? null,
                  vendorName: proposal.vendorName,
                  selectedVendorId: proposal.vendorId ?? proposal.id,
                  selectedVendorName: proposal.vendorName,
                  amount: proposal.quotedPrice || po.amount,
                  procurementStatus: "PO Created",
                  poApprovalRequired: false,
                  poApprovalStatus: undefined,
                  history: [
                    ...po.history,
                    createHistoryEntry(
                      po.id,
                      po.prNumber ?? po.documentNumber,
                      "PR",
                      currentUser.id,
                      currentUser.name,
                      currentUser.role,
                      "Vendor Confirmed",
                      comment || `ยืนยัน vendor ${proposal.vendorName}`,
                    ),
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : po,
          ),
          memos: state.memos.map((memo) =>
            memo.id === targetPo.memoId
              ? {
                  ...memo,
                  procurementStatus: "PO Created",
                  selectedVendorId: proposal.vendorId ?? proposal.id,
                  poNumber: memo.poNumber ?? targetPo.poNumber,
                  updatedAt: new Date().toISOString(),
                }
              : memo,
          ),
        });
      },
      selectVendor: (poId, vendorId) => {
        const vendor = vendors.find((item) => item.id === vendorId);
        if (!vendor) return;

        get().addVendorProposal(poId, {
          vendorId: vendor.id,
          vendorName: vendor.name,
          quotedPrice: vendor.price,
          leadTime: vendor.leadTime,
          paymentTerms: vendor.creditTerm,
          notes: vendor.badge,
          attachmentName: undefined,
          attachmentUrl: undefined,
          submittedToApprover: true,
        });

        const po = get().purchaseOrders.find((item) => item.id === poId);
        const proposalId = po?.vendorProposals[po.vendorProposals.length - 1]?.id;
        if (proposalId) {
          get().approveVendorSelection(poId, proposalId, `Auto-confirmed vendor ${vendor.name}`);
        }
      },
      sendPOForApproval: (poId) => {
        const proposalIds = get()
          .purchaseOrders.find((item) => item.id === poId)
          ?.vendorProposals.map((proposal) => proposal.id) ?? [];
        get().submitVendorProposals(poId, proposalIds);
      },
      approvePO: () => undefined,
      rejectPO: () => undefined,
      sendToVendor: (poId) => {
        const po = get().purchaseOrders.find((item) => item.id === poId);
        if (!po || po.procurementStatus !== "PO Created") return;

        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((item) =>
            item.id === poId
              ? {
                  ...item,
                  procurementStatus: "Sent to Vendor",
                  sentToVendorAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
          memos: state.memos.map((memo) =>
            memo.id === po.memoId
              ? {
                  ...memo,
                  procurementStatus: "Sent to Vendor",
                  updatedAt: new Date().toISOString(),
                }
              : memo,
          ),
        }));
      },
      receivePo: (poId, record) => {
        const state = get();
        const po = state.purchaseOrders.find((item) => item.id === poId);

        if (!po) return;

        const existing = state.receivingRecords.find((item) => item.poId === poId);
        const newRecord: ReceivingRecord = {
          id: existing?.id ?? `recv-${state.receivingRecords.length + 1}`,
          poId,
          poNumber: po.poNumber ?? po.documentNumber,
          vendorName: po.selectedVendorName ?? po.vendorName,
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

        const nextStatus = newRecord.qcRequired ? "Received" : "QC Passed";

        set({
          receivingRecords: state.receivingRecords.filter((item) => item.poId !== poId).concat(newRecord),
          purchaseOrders: state.purchaseOrders.map((item) =>
            item.id === poId
              ? {
                  ...item,
                  procurementStatus: nextStatus,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
          memos: state.memos.map((memo) =>
            memo.id === po.memoId
              ? {
                  ...memo,
                  procurementStatus: nextStatus,
                  updatedAt: new Date().toISOString(),
                }
              : memo,
          ),
        });
      },
      markQcPassed: (poId) => {
        const state = get();
        const po = state.purchaseOrders.find((item) => item.id === poId);
        const existingPayment = state.paymentRequests.find((item) => item.poId === poId);
        const receiving = state.receivingRecords.find((item) => item.poId === poId);

        if (!po || !receiving) return;

        const paymentRequest: PaymentRequest =
          existingPayment ?? {
            id: `pay-${state.paymentRequests.length + 1}`,
            poId,
            poNumber: po.poNumber ?? po.documentNumber,
            vendorName: po.selectedVendorName ?? po.vendorName,
            invoiceAmount: po.amount,
            receivingAmount: receiving.receivedQty,
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
          memos: state.memos.map((memo) =>
            memo.id === po.memoId
              ? {
                  ...memo,
                  procurementStatus: "QC Passed",
                  updatedAt: new Date().toISOString(),
                }
              : memo,
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
      version: 2,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      migrate: (persistedState) => normalizeState(persistedState as unknown as ProcurementState),
    },
  ),
);
