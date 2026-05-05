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
  | "Vendor Selected"
  | "PO Created"
  | "Pending PO Approval"
  | "PO Approved"
  | "PO Rejected"
  | "Sent to Vendor"
  | "Receiving"
  | "QC Pending"
  | "QC Passed"
  | "Payment Pending"
  | "Closed";

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
  documentType: "Memo" | "PO";
  actorId: string;
  actorName: string;
  role: Role;
  action: "Approved" | "Rejected" | "Revision Required" | "Submitted" | "Draft Saved";
  comment: string;
  date: string;
  actionLabelTh: string;
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
  poNumber?: string;
  prNumber?: string;
  poApprovalStatus?: "Pending" | "Approved" | "Rejected";
  requiresApproval?: boolean;
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
}

export interface ProcurementState extends CurrentStoreState {
  users: User[];
  memos: MemoRequest[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  poApprovalRequests: POApprovalRequest[];
  approvalHistory: ApprovalHistory[];
  receivingRecords: ReceivingRecord[];
  paymentRequests: PaymentRequest[];
  switchRole: (role: Role) => void;
  createMemo: (memo: Omit<MemoRequest, "id" | "documentNumber" | "createdAt" | "updatedAt" | "history" | "procurementStatus" | "status" | "assignedApproverId" | "currentApproverName" | "estimatedTotal">) => void;
  saveDraft: (memoId: string, updates: Partial<MemoRequest>) => void;
  submitMemo: (memoId: string) => void;
  approveMemo: (memoId: string, comment: string) => void;
  rejectMemo: (memoId: string, comment: string) => void;
  requestRevision: (memoId: string, comment: string) => void;
  createPR: (memoId: string) => void;
  selectVendor: (poId: string, vendorId: string) => void;
  createPO: (poId: string) => void;
  sendPOForApproval: (poId: string) => void;
  approvePO: (poApprovalId: string, comment: string) => void;
  rejectPO: (poApprovalId: string, comment: string) => void;
  sendToVendor: (poId: string) => void;
  receivePo: (poId: string, record: Partial<ReceivingRecord>) => void;
  markQcPassed: (poId: string) => void;
  updatePaymentStatus: (poId: string, status: PaymentRequest["status"]) => void;
}
