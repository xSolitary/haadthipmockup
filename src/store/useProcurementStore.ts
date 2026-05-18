import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import { apiFetch } from "@/lib/api";
import { findMockAccount } from "@/lib/mock-auth";
import { defaultRole, defaultUserId, initialStoreState } from "@/lib/mock-data";
import type {
  PaymentRequest,
  ProcurementState,
  ReceivingRecord,
  Role,
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
        const response = await apiFetch<{ memoId: string; data: BootstrapData }>("/api/memos", {
          method: "POST",
          body: JSON.stringify(memo),
        });
        patchBootstrapData(set, response.data);
        return response.memoId;
      },
      saveDraft: async (memoId, updates) => {
        await get().updateMemo(memoId, updates);
      },
      updateMemo: async (memoId, updates) => {
        const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
        patchBootstrapData(set, response.data);
      },
      submitMemo: async (memoId) => {
        const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/submit`, {
          method: "POST",
          body: JSON.stringify({ actorId: get().currentUserId }),
        });
        patchBootstrapData(set, response.data);
      },
      resubmitMemo: async (memoId, updates) => {
        const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/resubmit`, {
          method: "POST",
          body: JSON.stringify({
            actorId: get().currentUserId,
            updates,
          }),
        });
        patchBootstrapData(set, response.data);
      },
      approveMemo: async (memoId, comment) => {
        const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/approve`, {
          method: "POST",
          body: JSON.stringify({ actorId: get().currentUserId, comment }),
        });
        patchBootstrapData(set, response.data);
      },
      rejectMemo: async (memoId, comment) => {
        const response = await apiFetch<{ data: BootstrapData }>(`/api/memos/${memoId}/reject`, {
          method: "POST",
          body: JSON.stringify({ actorId: get().currentUserId, comment }),
        });
        patchBootstrapData(set, response.data);
      },
      requestRevision: async (memoId, comment) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/memos/${memoId}/request-revision`,
          {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId, comment }),
          },
        );
        patchBootstrapData(set, response.data);
      },
      createPR: async () => undefined,
      addVendorProposal: async (
        poId,
        proposal: Omit<VendorProposal, "id" | "proposedById" | "proposedByName" | "createdAt">,
      ) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/vendor-proposals`,
          {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId, proposal }),
          },
        );
        patchBootstrapData(set, response.data);
      },
      updateVendorProposal: async (poId, proposalId, updates) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/vendor-proposals/${proposalId}`,
          {
            method: "PATCH",
            body: JSON.stringify(updates),
          },
        );
        patchBootstrapData(set, response.data);
      },
      deleteVendorProposal: async (poId, proposalId) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/vendor-proposals/${proposalId}`,
          {
            method: "DELETE",
          },
        );
        patchBootstrapData(set, response.data);
      },
      submitVendorProposals: async (poId, proposalIds) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/submit-vendor-proposals`,
          {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId, proposalIds }),
          },
        );
        patchBootstrapData(set, response.data);
      },
      approveVendorSelection: async (poId, proposalId, comment) => {
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/purchase-orders/${poId}/approve-vendor-selection`,
          {
            method: "POST",
            body: JSON.stringify({ actorId: get().currentUserId, proposalId, comment }),
          },
        );
        patchBootstrapData(set, response.data);
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
        void nextStatus;
        const response = await apiFetch<{ data: BootstrapData }>(
          `/api/payment-requests/${paymentId}/advance-status`,
          {
            method: "POST",
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
        currentRole: state.currentRole,
        currentUserId: state.currentUserId,
        currentUsername: state.currentUsername,
        isAuthenticated: state.isAuthenticated,
        vendorDeliveries: state.vendorDeliveries,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<ProcurementState>),
      }),
    },
  ),
);
