export type Role =
  | "Requester"
  | "Approver"
  | "Purchasing"
  | "Finance"
  | "Admin";

export type MemoStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Revision Required"
  | "Converted to PR";

export type ProcurementStatus =
  | "Not Started"
  | "PR Created"
  | "Waiting for Purchasing to Propose Vendors"
  | "Pending PR Approval"
  | "Pending Vendor Approval"
  | "Vendor Approved"
  | "PO Created"
  | "Sent to Vendor"
  | "Pending Receiving"
  | "Received"
  | "QC Passed"
  | "Payment Pending"
  | "Closed"
  | "Vendor Selected"
  | "Pending PO Approval"
  | "PO Approved"
  | "PO Rejected"
  | "Receiving"
  | "QC Pending";

export type ProcurementCategory =
  | "Raw Material"
  | "Packaging"
  | "Spare Parts"
  | "Factory Supplies"
  | "Marketing / POSM"
  | "Fleet / Vehicle"
  | "IT / Office"
  | "Service / Contractor";

export type SiteName =
  | "Head Office"
  | "Hat Yai Plant"
  | "Surat Thani Distribution Center"
  | "Phuket Sales Office"
  | "Nakhon Si Thammarat Depot";

export interface User {
  id: string;
  name: string;
  role: Role;
  department: string;
  site: SiteName;
}

export interface MemoItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  category: ProcurementCategory;
}

export interface ApprovalHistory {
  id: string;
  documentId: string;
  documentNumber: string;
  documentType: "Memo" | "PR" | "PO";
  actorId: string;
  actorName: string;
  role: Role;
  action:
    | "Approved"
    | "Rejected"
    | "Revision Required"
    | "Submitted"
    | "Resubmitted"
    | "Draft Saved"
    | "Vendor Proposed"
    | "Submitted for Vendor Approval"
    | "Vendor Confirmed";
  comment: string;
  date: string;
  actionLabelTh: string;
}

export interface VendorProposal {
  id: string;
  vendorId?: string | null;
  vendorName: string;
  quotedPrice: number;
  leadTime: string;
  paymentTerms: string;
  notes: string;
  attachmentName?: string;
  attachmentUrl?: string;
  submittedToApprover?: boolean;
  proposedById: string;
  proposedByName: string;
  createdAt: string;
}

export interface MemoRequest {
  id: string;
  documentNumber: string;
  requesterId: string;
  requesterName: string;
  department: string;
  site: SiteName;
  costCenter: string;
  requestDate: string;
  requiredDate: string;
  title: string;
  category: ProcurementCategory;
  purpose: string;
  urgency: "Normal" | "Urgent" | "Emergency";
  budgetCode: string;
  deliveryLocation: string;
  items: MemoItem[];
  attachments: string[];
  budgetRemaining: number;
  status: MemoStatus;
  procurementStatus: ProcurementStatus;
  assignedApproverId: string;
  currentApproverName: string;
  estimatedTotal: number;
  createdAt: string;
  updatedAt: string;
  history: ApprovalHistory[];
  prNumber?: string;
  poNumber?: string;
  selectedVendorId?: string;
  poApprovalStatus?: "Pending" | "Approved" | "Rejected";
  poApprovalRequired?: boolean;
  poAmount?: number;
}

export interface Vendor {
  id: string;
  name: string;
  badge: string;
  price: number;
  leadTime: string;
  creditTerm: string;
  rating: number;
  approved: boolean;
  quotedPrice?: number;
}

export interface PurchaseOrder {
  id: string;
  documentNumber: string;
  memoId: string;
  memoTitle: string;
  vendorId: string | null;
  vendorName: string;
  procurementStatus: ProcurementStatus;
  amount: number;
  createdAt: string;
  updatedAt: string;
  sentToVendorAt?: string;
  quoteSelected?: string;
  selectedVendorId?: string;
  selectedVendorName?: string;
  poNumber?: string;
  prNumber?: string;
  poApprovalStatus?: "Pending" | "Approved" | "Rejected";
  poApprovalRequired?: boolean;
  vendorProposals: VendorProposal[];
  history: ApprovalHistory[];
}

export interface ReceivingRecord {
  id: string;
  poId: string;
  poNumber: string;
  vendorName: string;
  deliveryDate: string;
  receivedQty: number;
  condition: "Good" | "Damaged" | "Partial";
  lotNumber: string;
  batchNumber: string;
  expiryDate: string;
  coaMsds: boolean;
  qcRequired: boolean;
  qcStatus: "Pending QC" | "QC Passed" | "QC Failed" | "Quarantine" | "Not Required";
  notes: string;
}

export interface PaymentRequest {
  id: string;
  poId: string;
  poNumber: string;
  vendorName: string;
  invoiceAmount: number;
  receivingAmount: number;
  status:
    | "Pending Invoice"
    | "Ready for AP Posting"
    | "Approved for Payment"
    | "Paid";
  invoiceUploaded: boolean;
  createdAt: string;
}

export interface POApprovalRequest {
  id: string;
  documentNumber: string;
  poId: string;
  vendorName: string;
  amount: number;
  assignedApproverId: string;
  assignedApproverName: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  updatedAt: string;
  reason: string;
  history: ApprovalHistory[];
}

export interface CurrentStoreState {
  currentRole: Role;
  currentUserId: string;
  currentUsername: string | null;
  isAuthenticated: boolean;
}

export interface ProcurementState extends CurrentStoreState {
  isSyncing: boolean;
  initializeData: () => Promise<void>;
  users: User[];
  memos: MemoRequest[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  poApprovalRequests: POApprovalRequest[];
  approvalHistory: ApprovalHistory[];
  receivingRecords: ReceivingRecord[];
  paymentRequests: PaymentRequest[];
  login: (username: string, password: string) => { success: true } | { success: false; error: string };
  loginAsRole: (role: Extract<Role, "Requester" | "Approver" | "Purchasing" | "Finance">) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  createMemo: (memo: Omit<MemoRequest, "id" | "documentNumber" | "createdAt" | "updatedAt" | "history" | "procurementStatus" | "status" | "assignedApproverId" | "currentApproverName" | "estimatedTotal">) => Promise<string>;
  saveDraft: (memoId: string, updates: Partial<MemoRequest>) => Promise<void>;
  updateMemo: (memoId: string, updates: Partial<MemoRequest>) => Promise<void>;
  submitMemo: (memoId: string) => Promise<void>;
  resubmitMemo: (memoId: string, updates: Partial<MemoRequest>) => Promise<void>;
  approveMemo: (memoId: string, comment: string) => Promise<void>;
  rejectMemo: (memoId: string, comment: string) => Promise<void>;
  requestRevision: (memoId: string, comment: string) => Promise<void>;
  createPR: (memoId: string) => Promise<void>;
  addVendorProposal: (poId: string, proposal: Omit<VendorProposal, "id" | "proposedById" | "proposedByName" | "createdAt">) => Promise<void>;
  updateVendorProposal: (poId: string, proposalId: string, updates: Partial<VendorProposal>) => Promise<void>;
  deleteVendorProposal: (poId: string, proposalId: string) => Promise<void>;
  submitVendorProposals: (poId: string, proposalIds: string[]) => Promise<void>;
  approveVendorSelection: (poId: string, proposalId: string, comment: string) => Promise<void>;
  selectVendor: (poId: string, vendorId: string) => Promise<void>;
  sendPOForApproval: (poId: string) => Promise<void>;
  approvePO: (poApprovalId: string, comment: string) => Promise<void>;
  rejectPO: (poApprovalId: string, comment: string) => Promise<void>;
  sendToVendor: (poId: string) => Promise<void>;
  receivePo: (poId: string, record: Partial<ReceivingRecord>) => Promise<void>;
  markQcPassed: (poId: string) => Promise<void>;
  updatePaymentStatus: (paymentId: string, status: PaymentRequest["status"]) => Promise<void>;
}
