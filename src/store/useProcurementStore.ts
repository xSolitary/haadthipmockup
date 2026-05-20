import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import { apiFetch } from "@/lib/api";
import { findMockAccount } from "@/lib/mock-auth";
import { defaultRole, defaultUserId, initialStoreState } from "@/lib/mock-data";
import {
  validateMemoPayload,
  validateVendorProposalPayload,
} from "@/lib/procurement-validation";
import type {
  ApprovalHistory,
  MemoRequest,
  PaymentRequest,
  ProcurementState,
  ReceivingRecord,
  Role,
  User,
  VendorDeliveryUpdate,
  VendorProposal,
} from "@/lib/types";
import type { BootstrapData } from "@/lib/server/procurement";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const allowedLoginRoles: Array<
  Extract<Role, "Requester" | "Approver" | "Purchasing" | "Finance" | "Vendor">
> = ["Requester", "Approver", "Purchasing", "Finance", "Vendor"];

function getBaseState() {
  return {
    ...initialStoreState,
    vendorDeliveries: {},
    isSyncing: false,
    dataMode: "remote",
  } as unknown as Omit<
    ProcurementState,
    | "initializeData"
    | "login"
    | "loginAsRole"
    | "logout"
    | "switchRole"
    | "createMemo"
    | "saveDraft"
    | "updateMemo"
    | "submitMemo"
    | "resubmitMemo"
    | "approveMemo"
    | "rejectMemo"
    | "requestRevision"
    | "createPR"
    | "addVendorProposal"
    | "updateVendorProposal"
    | "deleteVendorProposal"
    | "submitVendorProposals"
    | "approveVendorSelection"
    | "selectVendor"
    | "sendPOForApproval"
    | "approvePO"
    | "rejectPO"
    | "sendToVendor"
    | "updateVendorDelivery"
    | "receivePo"
    | "markQcPassed"
    | "updatePaymentStatus"
  >;
}

function getUserForRole(state: ProcurementState, role: Role) {
  return state.users.find((user) => user.role === role) ?? state.users[0];
}

function mergeVendorUser(users: ProcurementState["users"]) {
  const vendorUser = initialStoreState.users.find((user) => user.role === "Vendor");
  if (!vendorUser) {
    return users;
  }

  const filteredUsers = users.filter((user) => user.id !== vendorUser.id);
  return [...filteredUsers, vendorUser];
}

function patchBootstrapData(set: (partial: Partial<ProcurementState>) => void, data: BootstrapData) {
  set({
    dataMode: "remote",
    users: mergeVendorUser(data.users),
    memos: data.memos,
    vendors: data.vendors,
    purchaseOrders: data.purchaseOrders,
    poApprovalRequests: data.poApprovalRequests,
    approvalHistory: data.approvalHistory,
    receivingRecords: data.receivingRecords,
    paymentRequests: data.paymentRequests,
  });
}

function isMissingDatabaseError(error: unknown) {
  return error instanceof Error && error.message.includes("Database is not configured");
}

function toIsoNow() {
  return new Date().toISOString();
}

function formatDocumentNumber(prefix: "MEMO" | "PR" | "PO", nextNumber: number) {
  return `${prefix}-2026-${String(nextNumber).padStart(6, "0")}`;
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildActionLabel(action: ApprovalHistory["action"]) {
  return action;
}

function buildHistoryEntry(params: {
  documentId: string;
  documentNumber: string;
  documentType: ApprovalHistory["documentType"];
  actor: User;
  action: ApprovalHistory["action"];
  comment: string;
}): ApprovalHistory {
  return {
    id: createLocalId("hist"),
    documentId: params.documentId,
    documentNumber: params.documentNumber,
    documentType: params.documentType,
    actorId: params.actor.id,
    actorName: params.actor.name,
    role: params.actor.role,
    action: params.action,
    comment: params.comment,
    date: toIsoNow(),
    actionLabelTh: buildActionLabel(params.action),
  };
}

function sumItems(items: Array<{ quantity: number; unitPrice: number }>) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function getActor(state: ProcurementState, actorId?: string) {
  return (
    state.users.find((user) => user.id === actorId) ??
    state.users.find((user) => user.id === state.currentUserId) ??
    state.users[0]
  );
}

function updateMemoInState(
  memos: MemoRequest[],
  memoId: string,
  updater: (memo: MemoRequest) => MemoRequest,
) {
  return memos.map((memo) => (memo.id === memoId ? updater(memo) : memo));
}

async function refreshBootstrap(set: (partial: Partial<ProcurementState>) => void) {
  const data = await apiFetch<BootstrapData>("/api/bootstrap");
  patchBootstrapData(set, data);
}

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      ...getBaseState(),
      initializeData: async () => {
        if (typeof window === "undefined") {
          return;
        }

        if (get().dataMode === "local") {
          return;
        }

        set({ isSyncing: true });
        try {
          await refreshBootstrap(set);
        } catch (error) {
          console.error("Failed to initialize procurement data", error);
        } finally {
          set({ isSyncing: false });
        }
      },
      login: (username, password) => {
        const account = findMockAccount(username, password);

        if (!account) {
          return {
            success: false,
            error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
          };
        }

        const user = getUserForRole(get(), account.role);

        set({
          currentRole: account.role,
          currentUserId: user?.id ?? defaultUserId,
          currentUsername: account.username,
          isAuthenticated: true,
        });

        return { success: true };
      },
      loginAsRole: (role) => {
        const user = getUserForRole(get(), role);
        set({
          currentRole: role,
          currentUserId: user?.id ?? defaultUserId,
          currentUsername: role.toLowerCase(),
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          currentRole: defaultRole,
          currentUserId: defaultUserId,
          currentUsername: null,
          isAuthenticated: false,
        });
      },
      switchRole: (role) => {
        const user = getUserForRole(get(), role);
        set({
          currentRole: role,
          currentUserId: user?.id ?? defaultUserId,
          currentUsername: role.toLowerCase(),
          isAuthenticated: allowedLoginRoles.includes(
            role as Extract<Role, "Requester" | "Approver" | "Purchasing" | "Finance" | "Vendor">,
          ),
        });
      },
      createMemo: async (memo) => {
        try {
          const response = await apiFetch<{ memoId: string; data: BootstrapData }>("/api/memos", {
            method: "POST",
            body: JSON.stringify(memo),
          });
          patchBootstrapData(set, response.data);
          return response.memoId;
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const validatedMemo = validateMemoPayload(memo) as typeof memo;
          const state = get();
          const actor = getActor(state, validatedMemo.requesterId);
          const approver = state.users.find((user) => user.role === "Approver") ?? actor;
          const memoId = createLocalId("memo");
          const documentNumber = formatDocumentNumber("MEMO", state.memos.length + 1);
          const now = toIsoNow();
          const createdMemo: MemoRequest = {
            ...validatedMemo,
            id: memoId,
            documentNumber,
            assignedApproverId: approver.id,
            currentApproverName: approver.name,
            estimatedTotal: sumItems(validatedMemo.items),
            status: "Draft" as const,
            procurementStatus: "Not Started" as const,
            createdAt: now,
            updatedAt: now,
            history: [
              buildHistoryEntry({
                documentId: memoId,
                documentNumber,
                documentType: "Memo",
                actor,
                action: "Draft Saved",
                comment: "Created memo draft in local demo mode",
              }),
            ],
          };

          set({
            dataMode: "local",
            memos: [...state.memos, createdMemo],
            approvalHistory: [...state.approvalHistory, ...createdMemo.history],
          });

          return memoId;
        }
      },
      saveDraft: async (memoId, updates) => {
        await get().updateMemo(memoId, updates);
      },
      updateMemo: async (memoId, updates) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}`, {
            method: "PATCH",
            body: JSON.stringify(updates),
          });
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const validatedUpdates = validateMemoPayload(updates, { partial: true });
          const state = get();
          set({
            dataMode: "local",
            memos: updateMemoInState(state.memos, memoId, (memo) => ({
              ...memo,
              ...validatedUpdates,
              estimatedTotal: validatedUpdates.items ? sumItems(validatedUpdates.items) : memo.estimatedTotal,
              updatedAt: toIsoNow(),
            })),
          });
        }
      },
      submitMemo: async (memoId) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/submit`, {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId }),
          });
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          const actor = getActor(state);
          let createdHistory: ApprovalHistory | null = null;
          const nextMemos = updateMemoInState(state.memos, memoId, (memo) => {
            createdHistory = buildHistoryEntry({
              documentId: memo.id,
              documentNumber: memo.documentNumber,
              documentType: "Memo",
              actor,
              action: "Submitted",
              comment: "Submitted memo in local demo mode",
            });
            return {
              ...memo,
              status: "Pending Approval" as const,
              updatedAt: toIsoNow(),
              history: [...memo.history, createdHistory],
            };
          });

          set({
            dataMode: "local",
            memos: nextMemos,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      resubmitMemo: async (memoId, updates) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/resubmit`, {
            method: "POST",
            body: JSON.stringify({
              actorId: get().currentUserId,
              updates,
            }),
          });
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const validatedUpdates = validateMemoPayload(updates, { partial: true });
          const state = get();
          const actor = getActor(state);
          let createdHistory: ApprovalHistory | null = null;
          const nextMemos = updateMemoInState(state.memos, memoId, (memo) => {
            createdHistory = buildHistoryEntry({
              documentId: memo.id,
              documentNumber: memo.documentNumber,
              documentType: "Memo",
              actor,
              action: "Resubmitted",
              comment: "Resubmitted memo in local demo mode",
            });
            return {
              ...memo,
              ...validatedUpdates,
              estimatedTotal: validatedUpdates.items ? sumItems(validatedUpdates.items) : memo.estimatedTotal,
              status: "Pending Approval" as const,
              updatedAt: toIsoNow(),
              history: [...memo.history, createdHistory],
            };
          });

          set({
            dataMode: "local",
            memos: nextMemos,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      approveMemo: async (memoId, comment) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/approve`, {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId, comment }),
          });
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          const actor = getActor(state);
          const poSequence = state.purchaseOrders.length + 1;
          const prNumber = formatDocumentNumber("PR", poSequence);
          const poNumber = formatDocumentNumber("PO", poSequence);
          const poId = `po-${poSequence}`;
          const now = toIsoNow();
          let createdHistory: ApprovalHistory | null = null;
          let createdPo: ProcurementState["purchaseOrders"][number] | null = null;

          const nextMemos = updateMemoInState(state.memos, memoId, (memo) => {
            createdHistory = buildHistoryEntry({
              documentId: memo.id,
              documentNumber: memo.documentNumber,
              documentType: "Memo",
              actor,
              action: "Approved",
              comment: comment || "Approved in local demo mode",
            });
            createdPo = {
              id: poId,
              documentNumber: prNumber,
              memoId: memo.id,
              memoTitle: memo.title,
              vendorId: null,
              vendorName: "Awaiting vendor proposal",
              procurementStatus: "Waiting for Purchasing to Propose Vendors" as const,
              amount: memo.estimatedTotal,
              createdAt: now,
              updatedAt: now,
              prNumber,
              poNumber,
              poApprovalRequired: false,
              vendorProposals: [],
              history: [],
            };
            return {
              ...memo,
              status: "Approved" as const,
              procurementStatus: "Waiting for Purchasing to Propose Vendors" as const,
              prNumber,
              poNumber,
              updatedAt: now,
              history: [...memo.history, createdHistory],
            };
          });

          set({
            dataMode: "local",
            memos: nextMemos,
            purchaseOrders: createdPo ? [...state.purchaseOrders, createdPo] : state.purchaseOrders,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      rejectMemo: async (memoId, comment) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/reject`, {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId, comment }),
          });
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          const actor = getActor(state);
          let createdHistory: ApprovalHistory | null = null;
          const nextMemos = updateMemoInState(state.memos, memoId, (memo) => {
            createdHistory = buildHistoryEntry({
              documentId: memo.id,
              documentNumber: memo.documentNumber,
              documentType: "Memo",
              actor,
              action: "Rejected",
              comment: comment || "Rejected in local demo mode",
            });
            return {
              ...memo,
              status: "Rejected" as const,
              updatedAt: toIsoNow(),
              history: [...memo.history, createdHistory],
            };
          });

          set({
            dataMode: "local",
            memos: nextMemos,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      requestRevision: async (memoId, comment) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(
            `/api/memos/${memoId}/request-revision`,
            {
              method: "POST",
              body: JSON.stringify({ actorId: get().currentUserId, comment }),
            },
          );
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          const actor = getActor(state);
          let createdHistory: ApprovalHistory | null = null;
          const nextMemos = updateMemoInState(state.memos, memoId, (memo) => {
            createdHistory = buildHistoryEntry({
              documentId: memo.id,
              documentNumber: memo.documentNumber,
              documentType: "Memo",
              actor,
              action: "Revision Required",
              comment: comment || "Revision requested in local demo mode",
            });
            return {
              ...memo,
              status: "Revision Required" as const,
              updatedAt: toIsoNow(),
              history: [...memo.history, createdHistory],
            };
          });

          set({
            dataMode: "local",
            memos: nextMemos,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      createPR: async () => undefined,
      addVendorProposal: async (
        poId,
        proposal: Omit<VendorProposal, "id" | "proposedById" | "proposedByName" | "createdAt">,
      ) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(
            `/api/purchase-orders/${poId}/vendor-proposals`,
            {
              method: "POST",
              body: JSON.stringify({ actorId: get().currentUserId, proposal }),
            },
          );
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const validatedProposal = validateVendorProposalPayload(proposal) as typeof proposal;
          const state = get();
          const actor = getActor(state);
          let createdHistory: ApprovalHistory | null = null;
          const nextPurchaseOrders = state.purchaseOrders.map((po) => {
            if (po.id !== poId) {
              return po;
            }

            const nextProposal: VendorProposal = {
              ...validatedProposal,
              id: createLocalId("proposal"),
              proposedById: actor.id,
              proposedByName: actor.name,
              createdAt: toIsoNow(),
            };
            createdHistory = buildHistoryEntry({
              documentId: po.id,
              documentNumber: po.prNumber ?? po.documentNumber,
              documentType: "PR",
              actor,
              action: "Vendor Proposed",
              comment: `Added vendor option ${validatedProposal.vendorName} in local demo mode`,
            });
            return {
              ...po,
              updatedAt: toIsoNow(),
              vendorProposals: [...po.vendorProposals, nextProposal],
              history: createdHistory ? [...po.history, createdHistory] : po.history,
            };
          });

          set({
            dataMode: "local",
            purchaseOrders: nextPurchaseOrders,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      updateVendorProposal: async (poId, proposalId, updates) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(
            `/api/purchase-orders/${poId}/vendor-proposals/${proposalId}`,
            {
              method: "PATCH",
              body: JSON.stringify(updates),
            },
          );
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const validatedUpdates = validateVendorProposalPayload(updates, { partial: true });
          const state = get();
          set({
            dataMode: "local",
            purchaseOrders: state.purchaseOrders.map((po) =>
              po.id !== poId
                ? po
                : {
                    ...po,
                    updatedAt: toIsoNow(),
                    vendorProposals: po.vendorProposals.map((proposal) =>
                      proposal.id === proposalId ? { ...proposal, ...validatedUpdates } : proposal,
                    ),
                  },
            ),
          });
        }
      },
      deleteVendorProposal: async (poId, proposalId) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(
            `/api/purchase-orders/${poId}/vendor-proposals/${proposalId}`,
            {
              method: "DELETE",
            },
          );
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          set({
            dataMode: "local",
            purchaseOrders: state.purchaseOrders.map((po) =>
              po.id !== poId
                ? po
                : {
                    ...po,
                    updatedAt: toIsoNow(),
                    vendorProposals: po.vendorProposals.filter((proposal) => proposal.id !== proposalId),
                  },
            ),
          });
        }
      },
      submitVendorProposals: async (poId, proposalIds) => {
        if (proposalIds.length === 0) {
          throw new Error("Select at least one vendor proposal before submitting");
        }

        try {
          const response = await apiFetch<{ data: BootstrapData }>(
            `/api/purchase-orders/${poId}/submit-vendor-proposals`,
            {
              method: "POST",
              body: JSON.stringify({ actorId: get().currentUserId, proposalIds }),
            },
          );
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          const actor = getActor(state);
          let createdHistory: ApprovalHistory | null = null;
          const nextPurchaseOrders = state.purchaseOrders.map((po) => {
            if (po.id !== poId) {
              return po;
            }

            createdHistory = buildHistoryEntry({
              documentId: po.id,
              documentNumber: po.prNumber ?? po.documentNumber,
              documentType: "PR",
              actor,
              action: "Submitted for Vendor Approval",
              comment: `Submitted ${proposalIds.length} vendor options in local demo mode`,
            });
            return {
              ...po,
              procurementStatus: "Pending Vendor Approval" as const,
              updatedAt: toIsoNow(),
              vendorProposals: po.vendorProposals.map((proposal) => ({
                ...proposal,
                submittedToApprover: proposalIds.includes(proposal.id),
              })),
              history: createdHistory ? [...po.history, createdHistory] : po.history,
            };
          });

          const poMemoId = state.purchaseOrders.find((po) => po.id === poId)?.memoId;
          const nextMemos = poMemoId
            ? updateMemoInState(state.memos, poMemoId, (memo) => ({
                ...memo,
                procurementStatus: "Pending Vendor Approval" as const,
                updatedAt: toIsoNow(),
              }))
            : state.memos;

          set({
            dataMode: "local",
            purchaseOrders: nextPurchaseOrders,
            memos: nextMemos,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      approveVendorSelection: async (poId, proposalId, comment) => {
        try {
          const response = await apiFetch<{ data: BootstrapData }>(
            `/api/purchase-orders/${poId}/approve-vendor-selection`,
            {
              method: "POST",
              body: JSON.stringify({ actorId: get().currentUserId, proposalId, comment }),
            },
          );
          patchBootstrapData(set, response.data);
        } catch (error) {
          if (!isMissingDatabaseError(error)) {
            throw error;
          }

          const state = get();
          const actor = getActor(state);
          const selectedPo = state.purchaseOrders.find((po) => po.id === poId);
          const selectedProposal = selectedPo?.vendorProposals.find((proposal) => proposal.id === proposalId);
          if (!selectedPo || !selectedProposal) {
            throw error;
          }

          let createdHistory: ApprovalHistory | null = null;
          const nextPurchaseOrders = state.purchaseOrders.map((po) => {
            if (po.id !== poId) {
              return po;
            }

            createdHistory = buildHistoryEntry({
              documentId: po.id,
              documentNumber: po.prNumber ?? po.documentNumber,
              documentType: "PR",
              actor,
              action: "Vendor Confirmed",
              comment: comment || `Confirmed ${selectedProposal.vendorName} in local demo mode`,
            });
            return {
              ...po,
              vendorId: selectedProposal.vendorId ?? null,
              vendorName: selectedProposal.vendorName,
              selectedVendorId: selectedProposal.vendorId ?? selectedProposal.id,
              selectedVendorName: selectedProposal.vendorName,
              amount: selectedProposal.quotedPrice,
              procurementStatus: "PO Created" as const,
              poApprovalRequired: false,
              poApprovalStatus: undefined,
              updatedAt: toIsoNow(),
              history: createdHistory ? [...po.history, createdHistory] : po.history,
            };
          });

          const nextMemos = updateMemoInState(state.memos, selectedPo.memoId, (memo) => ({
            ...memo,
            procurementStatus: "PO Created" as const,
            selectedVendorId: selectedProposal.vendorId ?? selectedProposal.id,
            updatedAt: toIsoNow(),
          }));

          set({
            dataMode: "local",
            purchaseOrders: nextPurchaseOrders,
            memos: nextMemos,
            approvalHistory: createdHistory
              ? [...state.approvalHistory, createdHistory]
              : state.approvalHistory,
          });
        }
      },
      selectVendor: async (poId, vendorId) => {
        const vendor = get().vendors.find((item) => item.id === vendorId);
        if (!vendor) {
          return;
        }

        await get().addVendorProposal(poId, {
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

        const refreshedPo = get().purchaseOrders.find((item) => item.id === poId);
        const proposalId = refreshedPo?.vendorProposals[refreshedPo.vendorProposals.length - 1]?.id;
        if (proposalId) {
          await get().approveVendorSelection(poId, proposalId, `Auto-confirmed vendor ${vendor.name}`);
        }
      },
      sendPOForApproval: async (poId) => {
        const proposalIds =
          get()
            .purchaseOrders.find((item) => item.id === poId)
            ?.vendorProposals.map((proposal) => proposal.id) ?? [];
        await get().submitVendorProposals(poId, proposalIds);
      },
      approvePO: async () => undefined,
      rejectPO: async () => undefined,
      sendToVendor: async () => undefined,
      updateVendorDelivery: (poId, updates) => {
        set((state) => {
          const current = state.vendorDeliveries[poId];
          const nextEntry: VendorDeliveryUpdate = {
            poId,
            ...updates,
          };

          return {
            vendorDeliveries: {
              ...state.vendorDeliveries,
              [poId]: current ? { ...current, ...nextEntry } : nextEntry,
            },
          };
        });
      },
      receivePo: async (poId, record: Partial<ReceivingRecord>) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/receive`,
          {
            method: "POST",
            body: JSON.stringify(record),
          },
        );
        patchBootstrapData(set, response.data);
      },
      markQcPassed: async (poId) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/mark-qc-passed`,
          {
            method: "POST",
          },
        );
        patchBootstrapData(set, response.data);
      },
      updatePaymentStatus: async (paymentId, nextStatus: PaymentRequest["status"]) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/payment-requests/${paymentId}/advance-status`,
          {
            method: "POST",
            body: JSON.stringify({ targetStatus: nextStatus }),
          },
        );
        patchBootstrapData(set, response.data);
      },
    }),
    {
      name: "ht-procurement-store",
      version: 4,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage,
      ),
      partialize: (state) => ({
        ...(state.dataMode === "local"
          ? {
              dataMode: state.dataMode,
              currentRole: state.currentRole,
              currentUserId: state.currentUserId,
              currentUsername: state.currentUsername,
              isAuthenticated: state.isAuthenticated,
              vendorDeliveries: state.vendorDeliveries,
              users: state.users,
              memos: state.memos,
              vendors: state.vendors,
              purchaseOrders: state.purchaseOrders,
              poApprovalRequests: state.poApprovalRequests,
              approvalHistory: state.approvalHistory,
              receivingRecords: state.receivingRecords,
              paymentRequests: state.paymentRequests,
            }
          : {
              dataMode: state.dataMode,
              currentRole: state.currentRole,
              currentUserId: state.currentUserId,
              currentUsername: state.currentUsername,
              isAuthenticated: state.isAuthenticated,
              vendorDeliveries: state.vendorDeliveries,
            }),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<ProcurementState>),
      }),
    },
  ),
);
