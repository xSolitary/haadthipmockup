import {
  DocumentType as PrismaDocumentType,
  HistoryAction as PrismaHistoryAction,
  MemoStatus as PrismaMemoStatus,
  MemoUrgency as PrismaMemoUrgency,
  POApprovalStatus as PrismaPOApprovalStatus,
  PaymentStatus as PrismaPaymentStatus,
  ProcurementCategory as PrismaProcurementCategory,
  ProcurementStatus as PrismaProcurementStatus,
  QCStatus as PrismaQCStatus,
  ReceivingCondition as PrismaReceivingCondition,
  Role as PrismaRole,
  SiteName as PrismaSiteName,
  type Prisma,
} from "@prisma/client";
import { defaultUserId, initialStoreState } from "@/lib/mock-data";
import type {
  ApprovalHistory,
  MemoRequest,
  PaymentRequest,
  ProcurementCategory,
  ProcurementState,
  PurchaseOrder,
  ReceivingRecord,
  Role,
  SiteName,
  User,
  Vendor,
  VendorProposal,
} from "@/lib/types";
import { prisma } from "@/lib/server/prisma";

export interface BootstrapData {
  users: User[];
  memos: MemoRequest[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  poApprovalRequests: ProcurementState["poApprovalRequests"];
  approvalHistory: ApprovalHistory[];
  receivingRecords: ReceivingRecord[];
  paymentRequests: PaymentRequest[];
}

type MemoWithRelations = Prisma.MemoGetPayload<{
  include: { items: true; history: true };
}>;

type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: { vendorProposals: true; history: true };
}>;

const memoInclude = {
  items: true,
  history: {
    orderBy: {
      date: "asc" as const,
    },
  },
} satisfies Prisma.MemoInclude;

const purchaseOrderInclude = {
  vendorProposals: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  history: {
    orderBy: {
      date: "asc" as const,
    },
  },
} satisfies Prisma.PurchaseOrderInclude;

let hasLoggedMissingDatabaseUrl = false;

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function ensureDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "Database is not configured. Create a .env file with DATABASE_URL, then start Postgres before using actions that change data.",
    );
  }
}

const roleToDb: Record<Role, PrismaRole> = {
  Requester: PrismaRole.Requester,
  Approver: PrismaRole.Approver,
  Purchasing: PrismaRole.Purchasing,
  Finance: PrismaRole.Finance,
  Vendor: PrismaRole.Admin,
  Admin: PrismaRole.Admin,
};

const roleFromDb: Record<PrismaRole, Role> = {
  [PrismaRole.Requester]: "Requester",
  [PrismaRole.Approver]: "Approver",
  [PrismaRole.Purchasing]: "Purchasing",
  [PrismaRole.Finance]: "Finance",
  [PrismaRole.Admin]: "Admin",
};

const siteToDb: Record<SiteName, PrismaSiteName> = {
  "Head Office": PrismaSiteName.HeadOffice,
  "Hat Yai Plant": PrismaSiteName.HatYaiPlant,
  "Surat Thani Distribution Center": PrismaSiteName.SuratThaniDistributionCenter,
  "Phuket Sales Office": PrismaSiteName.PhuketSalesOffice,
  "Nakhon Si Thammarat Depot": PrismaSiteName.NakhonSiThammaratDepot,
};

const siteFromDb: Record<PrismaSiteName, SiteName> = {
  [PrismaSiteName.HeadOffice]: "Head Office",
  [PrismaSiteName.HatYaiPlant]: "Hat Yai Plant",
  [PrismaSiteName.SuratThaniDistributionCenter]: "Surat Thani Distribution Center",
  [PrismaSiteName.PhuketSalesOffice]: "Phuket Sales Office",
  [PrismaSiteName.NakhonSiThammaratDepot]: "Nakhon Si Thammarat Depot",
};

const categoryToDb: Record<ProcurementCategory, PrismaProcurementCategory> = {
  "Raw Material": PrismaProcurementCategory.RawMaterial,
  Packaging: PrismaProcurementCategory.Packaging,
  "Spare Parts": PrismaProcurementCategory.SpareParts,
  "Factory Supplies": PrismaProcurementCategory.FactorySupplies,
  "Marketing / POSM": PrismaProcurementCategory.MarketingPOSM,
  "Fleet / Vehicle": PrismaProcurementCategory.FleetVehicle,
  "IT / Office": PrismaProcurementCategory.ITOffice,
  "Service / Contractor": PrismaProcurementCategory.ServiceContractor,
};

const categoryFromDb: Record<PrismaProcurementCategory, ProcurementCategory> = {
  [PrismaProcurementCategory.RawMaterial]: "Raw Material",
  [PrismaProcurementCategory.Packaging]: "Packaging",
  [PrismaProcurementCategory.SpareParts]: "Spare Parts",
  [PrismaProcurementCategory.FactorySupplies]: "Factory Supplies",
  [PrismaProcurementCategory.MarketingPOSM]: "Marketing / POSM",
  [PrismaProcurementCategory.FleetVehicle]: "Fleet / Vehicle",
  [PrismaProcurementCategory.ITOffice]: "IT / Office",
  [PrismaProcurementCategory.ServiceContractor]: "Service / Contractor",
};

const memoStatusToDb: Record<MemoRequest["status"], PrismaMemoStatus> = {
  Draft: PrismaMemoStatus.Draft,
  "Pending Approval": PrismaMemoStatus.PendingApproval,
  Approved: PrismaMemoStatus.Approved,
  Rejected: PrismaMemoStatus.Rejected,
  "Revision Required": PrismaMemoStatus.RevisionRequired,
  "Converted to PR": PrismaMemoStatus.ConvertedToPR,
};

const memoStatusFromDb: Record<PrismaMemoStatus, MemoRequest["status"]> = {
  [PrismaMemoStatus.Draft]: "Draft",
  [PrismaMemoStatus.PendingApproval]: "Pending Approval",
  [PrismaMemoStatus.Approved]: "Approved",
  [PrismaMemoStatus.Rejected]: "Rejected",
  [PrismaMemoStatus.RevisionRequired]: "Revision Required",
  [PrismaMemoStatus.ConvertedToPR]: "Converted to PR",
};

const procurementStatusToDb: Record<MemoRequest["procurementStatus"], PrismaProcurementStatus> = {
  "Not Started": PrismaProcurementStatus.NotStarted,
  "PR Created": PrismaProcurementStatus.PRCreated,
  "Waiting for Purchasing to Propose Vendors": PrismaProcurementStatus.WaitingForPurchasingToProposeVendors,
  "Pending PR Approval": PrismaProcurementStatus.PendingPRApproval,
  "Pending Vendor Approval": PrismaProcurementStatus.PendingVendorApproval,
  "Vendor Approved": PrismaProcurementStatus.VendorApproved,
  "PO Created": PrismaProcurementStatus.POCreated,
  "Sent to Vendor": PrismaProcurementStatus.SentToVendor,
  "Pending Receiving": PrismaProcurementStatus.PendingReceiving,
  Received: PrismaProcurementStatus.Received,
  "QC Passed": PrismaProcurementStatus.QCPassed,
  "Payment Pending": PrismaProcurementStatus.PaymentPending,
  Closed: PrismaProcurementStatus.Closed,
  "Vendor Selected": PrismaProcurementStatus.VendorSelected,
  "Pending PO Approval": PrismaProcurementStatus.PendingPOApproval,
  "PO Approved": PrismaProcurementStatus.POApproved,
  "PO Rejected": PrismaProcurementStatus.PORejected,
  Receiving: PrismaProcurementStatus.Receiving,
  "QC Pending": PrismaProcurementStatus.QCPending,
};

const procurementStatusFromDb: Record<PrismaProcurementStatus, MemoRequest["procurementStatus"]> = {
  [PrismaProcurementStatus.NotStarted]: "Not Started",
  [PrismaProcurementStatus.PRCreated]: "PR Created",
  [PrismaProcurementStatus.WaitingForPurchasingToProposeVendors]: "Waiting for Purchasing to Propose Vendors",
  [PrismaProcurementStatus.PendingPRApproval]: "Pending PR Approval",
  [PrismaProcurementStatus.PendingVendorApproval]: "Pending Vendor Approval",
  [PrismaProcurementStatus.VendorApproved]: "Vendor Approved",
  [PrismaProcurementStatus.POCreated]: "PO Created",
  [PrismaProcurementStatus.SentToVendor]: "Sent to Vendor",
  [PrismaProcurementStatus.PendingReceiving]: "Pending Receiving",
  [PrismaProcurementStatus.Received]: "Received",
  [PrismaProcurementStatus.QCPassed]: "QC Passed",
  [PrismaProcurementStatus.PaymentPending]: "Payment Pending",
  [PrismaProcurementStatus.Closed]: "Closed",
  [PrismaProcurementStatus.VendorSelected]: "Vendor Selected",
  [PrismaProcurementStatus.PendingPOApproval]: "Pending PO Approval",
  [PrismaProcurementStatus.POApproved]: "PO Approved",
  [PrismaProcurementStatus.PORejected]: "PO Rejected",
  [PrismaProcurementStatus.Receiving]: "Receiving",
  [PrismaProcurementStatus.QCPending]: "QC Pending",
};

const urgencyToDb: Record<MemoRequest["urgency"], PrismaMemoUrgency> = {
  Normal: PrismaMemoUrgency.Normal,
  Urgent: PrismaMemoUrgency.Urgent,
  Emergency: PrismaMemoUrgency.Emergency,
};

const urgencyFromDb: Record<PrismaMemoUrgency, MemoRequest["urgency"]> = {
  [PrismaMemoUrgency.Normal]: "Normal",
  [PrismaMemoUrgency.Urgent]: "Urgent",
  [PrismaMemoUrgency.Emergency]: "Emergency",
};

const docTypeToDb: Record<ApprovalHistory["documentType"], PrismaDocumentType> = {
  Memo: PrismaDocumentType.Memo,
  PR: PrismaDocumentType.PR,
  PO: PrismaDocumentType.PO,
};

const docTypeFromDb: Record<PrismaDocumentType, ApprovalHistory["documentType"]> = {
  [PrismaDocumentType.Memo]: "Memo",
  [PrismaDocumentType.PR]: "PR",
  [PrismaDocumentType.PO]: "PO",
};

const historyActionToDb: Record<ApprovalHistory["action"], PrismaHistoryAction> = {
  Approved: PrismaHistoryAction.Approved,
  Rejected: PrismaHistoryAction.Rejected,
  "Revision Required": PrismaHistoryAction.RevisionRequired,
  Submitted: PrismaHistoryAction.Submitted,
  Resubmitted: PrismaHistoryAction.Resubmitted,
  "Draft Saved": PrismaHistoryAction.DraftSaved,
  "Vendor Proposed": PrismaHistoryAction.VendorProposed,
  "Submitted for Vendor Approval": PrismaHistoryAction.SubmittedForVendorApproval,
  "Vendor Confirmed": PrismaHistoryAction.VendorConfirmed,
};

const historyActionFromDb: Record<PrismaHistoryAction, ApprovalHistory["action"]> = {
  [PrismaHistoryAction.Approved]: "Approved",
  [PrismaHistoryAction.Rejected]: "Rejected",
  [PrismaHistoryAction.RevisionRequired]: "Revision Required",
  [PrismaHistoryAction.Submitted]: "Submitted",
  [PrismaHistoryAction.Resubmitted]: "Resubmitted",
  [PrismaHistoryAction.DraftSaved]: "Draft Saved",
  [PrismaHistoryAction.VendorProposed]: "Vendor Proposed",
  [PrismaHistoryAction.SubmittedForVendorApproval]: "Submitted for Vendor Approval",
  [PrismaHistoryAction.VendorConfirmed]: "Vendor Confirmed",
};

const paymentStatusToDb: Record<PaymentRequest["status"], PrismaPaymentStatus> = {
  "Pending Invoice": PrismaPaymentStatus.PendingInvoice,
  "Ready for AP Posting": PrismaPaymentStatus.ReadyForAPPosting,
  "Approved for Payment": PrismaPaymentStatus.ApprovedForPayment,
  Paid: PrismaPaymentStatus.Paid,
};

const paymentStatusFromDb: Record<PrismaPaymentStatus, PaymentRequest["status"]> = {
  [PrismaPaymentStatus.PendingInvoice]: "Pending Invoice",
  [PrismaPaymentStatus.ReadyForAPPosting]: "Ready for AP Posting",
  [PrismaPaymentStatus.ApprovedForPayment]: "Approved for Payment",
  [PrismaPaymentStatus.Paid]: "Paid",
};

const qcStatusToDb: Record<ReceivingRecord["qcStatus"], PrismaQCStatus> = {
  "Pending QC": PrismaQCStatus.PendingQC,
  "QC Passed": PrismaQCStatus.QCPassed,
  "QC Failed": PrismaQCStatus.QCFailed,
  Quarantine: PrismaQCStatus.Quarantine,
  "Not Required": PrismaQCStatus.NotRequired,
};

const qcStatusFromDb: Record<PrismaQCStatus, ReceivingRecord["qcStatus"]> = {
  [PrismaQCStatus.PendingQC]: "Pending QC",
  [PrismaQCStatus.QCPassed]: "QC Passed",
  [PrismaQCStatus.QCFailed]: "QC Failed",
  [PrismaQCStatus.Quarantine]: "Quarantine",
  [PrismaQCStatus.NotRequired]: "Not Required",
};

const conditionToDb: Record<ReceivingRecord["condition"], PrismaReceivingCondition> = {
  Good: PrismaReceivingCondition.Good,
  Damaged: PrismaReceivingCondition.Damaged,
  Partial: PrismaReceivingCondition.Partial,
};

const conditionFromDb: Record<PrismaReceivingCondition, ReceivingRecord["condition"]> = {
  [PrismaReceivingCondition.Good]: "Good",
  [PrismaReceivingCondition.Damaged]: "Damaged",
  [PrismaReceivingCondition.Partial]: "Partial",
};

const poApprovalStatusToDb: Record<NonNullable<MemoRequest["poApprovalStatus"]>, PrismaPOApprovalStatus> = {
  Pending: PrismaPOApprovalStatus.Pending,
  Approved: PrismaPOApprovalStatus.Approved,
  Rejected: PrismaPOApprovalStatus.Rejected,
};

const poApprovalStatusFromDb: Record<PrismaPOApprovalStatus, NonNullable<MemoRequest["poApprovalStatus"]>> = {
  [PrismaPOApprovalStatus.Pending]: "Pending",
  [PrismaPOApprovalStatus.Approved]: "Approved",
  [PrismaPOApprovalStatus.Rejected]: "Rejected",
};

function cloneFallbackData(): BootstrapData {
  const base = initialStoreState as unknown as ProcurementState;
  return {
    users: structuredClone(base.users),
    memos: structuredClone(base.memos),
    vendors: structuredClone(base.vendors),
    purchaseOrders: structuredClone(base.purchaseOrders),
    poApprovalRequests: structuredClone(base.poApprovalRequests),
    approvalHistory: structuredClone(base.approvalHistory),
    receivingRecords: structuredClone(base.receivingRecords),
    paymentRequests: structuredClone(base.paymentRequests),
  };
}

function formatDocumentNumber(prefix: string, index: number) {
  return `${prefix}-2026-${String(index).padStart(6, "0")}`;
}

function createEntityId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function calculateTotal(items: Array<{ quantity: number; unitPrice: number }>) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapHistory(row: {
  id: string;
  documentId: string;
  documentNumber: string;
  documentType: PrismaDocumentType;
  actorId: string;
  actorName: string;
  role: PrismaRole;
  action: PrismaHistoryAction;
  comment: string;
  date: Date;
  actionLabelTh: string;
}): ApprovalHistory {
  return {
    id: row.id,
    documentId: row.documentId,
    documentNumber: row.documentNumber,
    documentType: docTypeFromDb[row.documentType],
    actorId: row.actorId,
    actorName: row.actorName,
    role: roleFromDb[row.role],
    action: historyActionFromDb[row.action],
    comment: row.comment,
    date: row.date.toISOString(),
    actionLabelTh: row.actionLabelTh,
  };
}

function mapMemo(row: MemoWithRelations): MemoRequest {
  return {
    id: row.id,
    documentNumber: row.documentNumber,
    requesterId: row.requesterId,
    requesterName: row.requesterName,
    department: row.department,
    site: siteFromDb[row.site],
    costCenter: row.costCenter,
    requestDate: row.requestDate,
    requiredDate: row.requiredDate,
    title: row.title,
    category: categoryFromDb[row.category],
    purpose: row.purpose,
    urgency: urgencyFromDb[row.urgency],
    budgetCode: row.budgetCode,
    deliveryLocation: row.deliveryLocation,
    items: row.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      category: categoryFromDb[item.category],
    })),
    attachments: row.attachments,
    budgetRemaining: row.budgetRemaining,
    status: memoStatusFromDb[row.status],
    procurementStatus: procurementStatusFromDb[row.procurementStatus],
    assignedApproverId: row.assignedApproverId,
    currentApproverName: row.currentApproverName,
    estimatedTotal: row.estimatedTotal,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    history: row.history.map(mapHistory),
    prNumber: row.prNumber ?? undefined,
    poNumber: row.poNumber ?? undefined,
    selectedVendorId: row.selectedVendorId ?? undefined,
    poApprovalStatus: row.poApprovalStatus ? poApprovalStatusFromDb[row.poApprovalStatus] : undefined,
    poApprovalRequired: row.poApprovalRequired ?? undefined,
    poAmount: row.poAmount ?? undefined,
  };
}

function mapVendorProposal(row: Prisma.VendorProposalGetPayload<object>): VendorProposal {
  return {
    id: row.id,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    quotedPrice: row.quotedPrice,
    leadTime: row.leadTime,
    paymentTerms: row.paymentTerms,
    notes: row.notes,
    attachmentName: row.attachmentName ?? undefined,
    attachmentUrl: row.attachmentUrl ?? undefined,
    submittedToApprover: row.submittedToApprover,
    proposedById: row.proposedById,
    proposedByName: row.proposedByName,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapPurchaseOrder(row: PurchaseOrderWithRelations): PurchaseOrder {
  return {
    id: row.id,
    documentNumber: row.documentNumber,
    memoId: row.memoId,
    memoTitle: row.memoTitle,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    procurementStatus: procurementStatusFromDb[row.procurementStatus],
    amount: row.amount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sentToVendorAt: row.sentToVendorAt?.toISOString(),
    quoteSelected: row.quoteSelected ?? undefined,
    selectedVendorId: row.selectedVendorId ?? undefined,
    selectedVendorName: row.selectedVendorName ?? undefined,
    poNumber: row.poNumber ?? undefined,
    prNumber: row.prNumber ?? undefined,
    poApprovalStatus: row.poApprovalStatus ? poApprovalStatusFromDb[row.poApprovalStatus] : undefined,
    poApprovalRequired: row.poApprovalRequired ?? undefined,
    vendorProposals: row.vendorProposals.map(mapVendorProposal),
    history: row.history.map(mapHistory),
  };
}

function mapReceivingRecord(row: Prisma.ReceivingRecordGetPayload<object>): ReceivingRecord {
  return {
    id: row.id,
    poId: row.poId,
    poNumber: row.poNumber,
    vendorName: row.vendorName,
    deliveryDate: row.deliveryDate,
    receivedQty: row.receivedQty,
    condition: conditionFromDb[row.condition],
    lotNumber: row.lotNumber,
    batchNumber: row.batchNumber,
    expiryDate: row.expiryDate,
    coaMsds: row.coaMsds,
    qcRequired: row.qcRequired,
    qcStatus: qcStatusFromDb[row.qcStatus],
    notes: row.notes,
  };
}

function mapPaymentRequest(row: Prisma.PaymentRequestGetPayload<object>): PaymentRequest {
  return {
    id: row.id,
    poId: row.poId,
    poNumber: row.poNumber,
    vendorName: row.vendorName,
    invoiceAmount: row.invoiceAmount,
    receivingAmount: row.receivingAmount,
    status: paymentStatusFromDb[row.status],
    invoiceUploaded: row.invoiceUploaded,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapUser(row: Prisma.UserGetPayload<object>): User {
  return {
    id: row.id,
    name: row.name,
    role: roleFromDb[row.role],
    department: row.department,
    site: siteFromDb[row.site],
  };
}

function mapVendor(row: Prisma.VendorGetPayload<object>): Vendor {
  return {
    id: row.id,
    name: row.name,
    badge: row.badge,
    price: row.price,
    leadTime: row.leadTime,
    creditTerm: row.creditTerm,
    rating: row.rating,
    approved: row.approved,
  };
}

function buildHistoryLabel(action: ApprovalHistory["action"]) {
  if (action === "Approved") return "อนุมัติ";
  if (action === "Rejected") return "ไม่อนุมัติ";
  if (action === "Revision Required") return "ขอแก้ไข";
  if (action === "Submitted") return "ส่งขออนุมัติ";
  if (action === "Resubmitted") return "ส่งแก้ไขใหม่";
  if (action === "Vendor Proposed") return "เสนอ vendor";
  if (action === "Submitted for Vendor Approval") return "ส่งอนุมัติ vendor";
  if (action === "Vendor Confirmed") return "ยืนยัน vendor";
  return "บันทึกร่าง";
}

async function getActor(actorId?: string) {
  ensureDatabaseConfigured();
  const selectedId = actorId ?? defaultUserId;
  return prisma.user.findUnique({ where: { id: selectedId } });
}

async function requireActor(actorId?: string) {
  const actor = await getActor(actorId);
  if (!actor) {
    throw new Error("Actor not found");
  }
  return actor;
}

async function createHistoryEntryTx(
  tx: Prisma.TransactionClient,
  params: {
    memoId?: string;
    purchaseOrderId?: string;
    documentId: string;
    documentNumber: string;
    documentType: ApprovalHistory["documentType"];
    actorId: string;
    actorName: string;
    role: Role;
    action: ApprovalHistory["action"];
    comment: string;
  },
) {
  return tx.approvalHistory.create({
    data: {
      id: `hist-${crypto.randomUUID()}`,
      memoId: params.memoId,
      purchaseOrderId: params.purchaseOrderId,
      documentId: params.documentId,
      documentNumber: params.documentNumber,
      documentType: docTypeToDb[params.documentType],
      actorId: params.actorId,
      actorName: params.actorName,
      role: roleToDb[params.role],
      action: historyActionToDb[params.action],
      comment: params.comment,
      date: new Date(),
      actionLabelTh: buildHistoryLabel(params.action),
    },
  });
}

async function getDatabaseBootstrapData(): Promise<BootstrapData | null> {
  if (!isDatabaseConfigured()) {
    if (!hasLoggedMissingDatabaseUrl) {
      hasLoggedMissingDatabaseUrl = true;
      console.warn("DATABASE_URL is not set. Falling back to bundled mock procurement data.");
    }
    return null;
  }

  try {
    const [users, memos, vendors, purchaseOrders, receivingRecords, paymentRequests] =
      await Promise.all([
        prisma.user.findMany({ orderBy: { id: "asc" } }),
        prisma.memo.findMany({ include: memoInclude, orderBy: { createdAt: "asc" } }),
        prisma.vendor.findMany({ orderBy: { id: "asc" } }),
        prisma.purchaseOrder.findMany({
          include: purchaseOrderInclude,
          orderBy: { createdAt: "asc" },
        }),
        prisma.receivingRecord.findMany({ orderBy: { id: "asc" } }),
        prisma.paymentRequest.findMany({ orderBy: { createdAt: "asc" } }),
      ]);

    if (users.length === 0 || memos.length === 0) {
      return null;
    }

    const mappedMemos = memos.map(mapMemo);
    const mappedPurchaseOrders = purchaseOrders.map(mapPurchaseOrder);
    const mappedHistory = [
      ...mappedMemos.flatMap((memo) => memo.history),
      ...mappedPurchaseOrders.flatMap((po) => po.history),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      users: users.map(mapUser),
      memos: mappedMemos,
      vendors: vendors.map(mapVendor),
      purchaseOrders: mappedPurchaseOrders,
      poApprovalRequests: [],
      approvalHistory: mappedHistory,
      receivingRecords: receivingRecords.map(mapReceivingRecord),
      paymentRequests: paymentRequests.map(mapPaymentRequest),
    };
  } catch (error) {
    console.error("Failed to load bootstrap data from database", error);
    return null;
  }
}

export async function getBootstrapData() {
  const databaseData = await getDatabaseBootstrapData();
  return databaseData ?? cloneFallbackData();
}

export async function getUsers() {
  return (await getBootstrapData()).users;
}

export async function getMemos() {
  return (await getBootstrapData()).memos;
}

export async function getMemoById(memoId: string) {
  const bootstrap = await getBootstrapData();
  return bootstrap.memos.find((memo) => memo.id === memoId) ?? null;
}

export async function getPurchaseOrders() {
  return (await getBootstrapData()).purchaseOrders;
}

export async function getPurchaseOrderById(poId: string) {
  const bootstrap = await getBootstrapData();
  return bootstrap.purchaseOrders.find((po) => po.id === poId) ?? null;
}

export async function getPaymentRequests() {
  return (await getBootstrapData()).paymentRequests;
}

export async function getReportSummary() {
  const bootstrap = await getBootstrapData();
  const approvedSpend = bootstrap.memos
    .filter((memo) => memo.status === "Approved")
    .reduce((sum, memo) => sum + memo.estimatedTotal, 0);
  const emergencyCount = bootstrap.memos.filter((memo) => memo.urgency === "Emergency").length;
  const spendByCategory = bootstrap.memos.reduce<Record<string, number>>((acc, memo) => {
    acc[memo.category] = (acc[memo.category] ?? 0) + memo.estimatedTotal;
    return acc;
  }, {});
  const spendBySite = bootstrap.memos.reduce<Record<string, number>>((acc, memo) => {
    acc[memo.site] = (acc[memo.site] ?? 0) + memo.estimatedTotal;
    return acc;
  }, {});

  return {
    approvedSpend,
    emergencyCount,
    memoCount: bootstrap.memos.length,
    purchaseOrderCount: bootstrap.purchaseOrders.length,
    paymentRequestCount: bootstrap.paymentRequests.length,
    spendByCategory,
    spendBySite,
  };
}

export type MutableMemoPayload = Omit<
  MemoRequest,
  | "id"
  | "documentNumber"
  | "status"
  | "procurementStatus"
  | "assignedApproverId"
  | "currentApproverName"
  | "estimatedTotal"
  | "createdAt"
  | "updatedAt"
  | "history"
>;

async function refreshBootstrapFromDbOrFallback() {
  return getBootstrapData();
}

export async function createMemo(payload: MutableMemoPayload) {
  const actor = await requireActor(payload.requesterId);
  const approver =
    (await prisma.user.findFirst({ where: { role: PrismaRole.Approver }, orderBy: { id: "asc" } })) ??
    actor;
  const count = await prisma.memo.count();
  const memoId = createEntityId("memo");
  const documentNumber = formatDocumentNumber("MEMO", count + 1);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.memo.create({
      data: {
        id: memoId,
        documentNumber,
        requesterId: payload.requesterId,
        requesterName: payload.requesterName,
        department: payload.department,
        site: siteToDb[payload.site],
        costCenter: payload.costCenter,
        requestDate: payload.requestDate,
        requiredDate: payload.requiredDate,
        title: payload.title,
        category: categoryToDb[payload.category],
        purpose: payload.purpose,
        urgency: urgencyToDb[payload.urgency],
        budgetCode: payload.budgetCode,
        deliveryLocation: payload.deliveryLocation,
        attachments: payload.attachments,
        budgetRemaining: payload.budgetRemaining,
        status: PrismaMemoStatus.Draft,
        procurementStatus: PrismaProcurementStatus.NotStarted,
        assignedApproverId: approver.id,
        currentApproverName: approver.name,
        estimatedTotal: calculateTotal(payload.items),
        createdAt: now,
        updatedAt: now,
        selectedVendorId: payload.selectedVendorId,
        poApprovalRequired: payload.poApprovalRequired,
        poApprovalStatus: payload.poApprovalStatus ? poApprovalStatusToDb[payload.poApprovalStatus] : undefined,
        poAmount: payload.poAmount,
        items: {
          create: payload.items.map((item) => ({
            id: createEntityId("memo-item"),
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            category: categoryToDb[item.category],
          })),
        },
      },
    });

    await createHistoryEntryTx(tx, {
      memoId,
      documentId: memoId,
      documentNumber,
      documentType: "Memo",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Draft Saved",
      comment: "สร้างร่าง Memo",
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

async function updateMemoItems(tx: Prisma.TransactionClient, memoId: string, items: MutableMemoPayload["items"]) {
  await tx.memoItem.deleteMany({ where: { memoId } });
  if (items.length > 0) {
    await tx.memoItem.createMany({
      data: items.map((item) => ({
        id: createEntityId("memo-item"),
        memoId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        category: categoryToDb[item.category],
      })),
    });
  }
}

export async function updateMemo(memoId: string, updates: Partial<MutableMemoPayload>) {
  await prisma.$transaction(async (tx) => {
    const memo = await tx.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new Error("Memo not found");
    }

    if (updates.items) {
      await updateMemoItems(tx, memoId, updates.items);
    }

    await tx.memo.update({
      where: { id: memoId },
      data: {
        requesterId: updates.requesterId,
        requesterName: updates.requesterName,
        department: updates.department,
        site: updates.site ? siteToDb[updates.site] : undefined,
        costCenter: updates.costCenter,
        requestDate: updates.requestDate,
        requiredDate: updates.requiredDate,
        title: updates.title,
        category: updates.category ? categoryToDb[updates.category] : undefined,
        purpose: updates.purpose,
        urgency: updates.urgency ? urgencyToDb[updates.urgency] : undefined,
        budgetCode: updates.budgetCode,
        deliveryLocation: updates.deliveryLocation,
        attachments: updates.attachments,
        budgetRemaining: updates.budgetRemaining,
        estimatedTotal: updates.items ? calculateTotal(updates.items) : undefined,
        updatedAt: new Date(),
        selectedVendorId: updates.selectedVendorId,
        poApprovalRequired: updates.poApprovalRequired,
        poApprovalStatus: updates.poApprovalStatus ? poApprovalStatusToDb[updates.poApprovalStatus] : undefined,
        poAmount: updates.poAmount,
      },
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function submitMemo(memoId: string, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const memo = await tx.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new Error("Memo not found");
    }

    await tx.memo.update({
      where: { id: memoId },
      data: {
        status: PrismaMemoStatus.PendingApproval,
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      memoId,
      documentId: memoId,
      documentNumber: memo.documentNumber,
      documentType: "Memo",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Submitted",
      comment: "ส่งคำขอเพื่อขออนุมัติ",
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function resubmitMemo(memoId: string, updates: Partial<MutableMemoPayload>, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const memo = await tx.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new Error("Memo not found");
    }

    if (updates.items) {
      await updateMemoItems(tx, memoId, updates.items);
    }

    await tx.memo.update({
      where: { id: memoId },
      data: {
        requesterId: updates.requesterId,
        requesterName: updates.requesterName,
        department: updates.department,
        site: updates.site ? siteToDb[updates.site] : undefined,
        costCenter: updates.costCenter,
        requestDate: updates.requestDate,
        requiredDate: updates.requiredDate,
        title: updates.title,
        category: updates.category ? categoryToDb[updates.category] : undefined,
        purpose: updates.purpose,
        urgency: updates.urgency ? urgencyToDb[updates.urgency] : undefined,
        budgetCode: updates.budgetCode,
        deliveryLocation: updates.deliveryLocation,
        attachments: updates.attachments,
        budgetRemaining: updates.budgetRemaining,
        estimatedTotal: updates.items ? calculateTotal(updates.items) : undefined,
        status: PrismaMemoStatus.PendingApproval,
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      memoId,
      documentId: memoId,
      documentNumber: memo.documentNumber,
      documentType: "Memo",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Resubmitted",
      comment: "แก้ไขและส่งคำขออีกครั้ง",
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function approveMemo(memoId: string, comment: string, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const memo = await tx.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new Error("Memo not found");
    }

    const count = await tx.purchaseOrder.count();
    const prNumber = formatDocumentNumber("PR", count + 1);
    const poNumber = formatDocumentNumber("PO", count + 1);
    const poId = `po-${count + 1}`;
    const now = new Date();

    await tx.memo.update({
      where: { id: memoId },
      data: {
        status: PrismaMemoStatus.Approved,
        procurementStatus: PrismaProcurementStatus.WaitingForPurchasingToProposeVendors,
        prNumber,
        poNumber,
        updatedAt: now,
      },
    });

    await createHistoryEntryTx(tx, {
      memoId,
      documentId: memoId,
      documentNumber: memo.documentNumber,
      documentType: "Memo",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Approved",
      comment: comment || "อนุมัติคำขอ",
    });

    await tx.purchaseOrder.create({
      data: {
        id: poId,
        documentNumber: prNumber,
        memoId,
        memoTitle: memo.title,
        vendorId: null,
        vendorName: "Awaiting vendor proposal",
        procurementStatus: PrismaProcurementStatus.WaitingForPurchasingToProposeVendors,
        amount: memo.estimatedTotal,
        prNumber,
        poNumber,
        poApprovalRequired: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function rejectMemo(memoId: string, comment: string, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const memo = await tx.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new Error("Memo not found");
    }

    await tx.memo.update({
      where: { id: memoId },
      data: {
        status: PrismaMemoStatus.Rejected,
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      memoId,
      documentId: memoId,
      documentNumber: memo.documentNumber,
      documentType: "Memo",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Rejected",
      comment: comment || "ไม่อนุมัติคำขอ",
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function requestMemoRevision(memoId: string, comment: string, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const memo = await tx.memo.findUnique({ where: { id: memoId } });
    if (!memo) {
      throw new Error("Memo not found");
    }

    await tx.memo.update({
      where: { id: memoId },
      data: {
        status: PrismaMemoStatus.RevisionRequired,
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      memoId,
      documentId: memoId,
      documentNumber: memo.documentNumber,
      documentType: "Memo",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Revision Required",
      comment: comment || "ขอแก้ไขข้อมูล",
    });
  });

  return {
    memoId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export type VendorProposalPayload = Omit<
  VendorProposal,
  "id" | "proposedById" | "proposedByName" | "createdAt"
>;

export async function addVendorProposal(poId: string, proposal: VendorProposalPayload, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) {
      throw new Error("Purchase order not found");
    }

    await tx.vendorProposal.create({
      data: {
        id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        purchaseOrderId: poId,
        vendorId: proposal.vendorId ?? null,
        vendorName: proposal.vendorName,
        quotedPrice: proposal.quotedPrice,
        leadTime: proposal.leadTime,
        paymentTerms: proposal.paymentTerms,
        notes: proposal.notes,
        attachmentName: proposal.attachmentName,
        attachmentUrl: proposal.attachmentUrl,
        submittedToApprover: proposal.submittedToApprover ?? false,
        proposedById: actor.id,
        proposedByName: actor.name,
        createdAt: new Date(),
      },
    });

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      purchaseOrderId: poId,
      documentId: poId,
      documentNumber: po.prNumber ?? po.documentNumber,
      documentType: "PR",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Vendor Proposed",
      comment: `เพิ่ม vendor option: ${proposal.vendorName}`,
    });
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function updateVendorProposal(
  poId: string,
  proposalId: string,
  updates: Partial<VendorProposalPayload>,
) {
  await prisma.vendorProposal.update({
    where: { id: proposalId, purchaseOrderId: poId },
    data: {
      vendorId: updates.vendorId,
      vendorName: updates.vendorName,
      quotedPrice: updates.quotedPrice,
      leadTime: updates.leadTime,
      paymentTerms: updates.paymentTerms,
      notes: updates.notes,
      attachmentName: updates.attachmentName,
      attachmentUrl: updates.attachmentUrl,
      submittedToApprover: updates.submittedToApprover,
    },
  });

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { updatedAt: new Date() },
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function deleteVendorProposal(poId: string, proposalId: string) {
  await prisma.vendorProposal.delete({
    where: { id: proposalId, purchaseOrderId: poId },
  });

  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { updatedAt: new Date() },
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function submitVendorProposals(poId: string, proposalIds: string[], actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) {
      throw new Error("Purchase order not found");
    }

    await tx.vendorProposal.updateMany({
      where: { purchaseOrderId: poId },
      data: { submittedToApprover: false },
    });

    if (proposalIds.length > 0) {
      await tx.vendorProposal.updateMany({
        where: {
          purchaseOrderId: poId,
          id: { in: proposalIds },
        },
        data: { submittedToApprover: true },
      });
    }

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        procurementStatus: PrismaProcurementStatus.PendingVendorApproval,
        updatedAt: new Date(),
      },
    });

    await tx.memo.update({
      where: { id: po.memoId },
      data: {
        procurementStatus: PrismaProcurementStatus.PendingVendorApproval,
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      purchaseOrderId: poId,
      documentId: poId,
      documentNumber: po.prNumber ?? po.documentNumber,
      documentType: "PR",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Submitted for Vendor Approval",
      comment: `ส่ง vendor options ${proposalIds.length} รายการให้ approver ตัดสินใจ`,
    });
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function approveVendorSelection(poId: string, proposalId: string, comment: string, actorId?: string) {
  const actor = await requireActor(actorId);
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: poId },
    });
    const proposal = await tx.vendorProposal.findUnique({
      where: { id: proposalId },
    });

    if (!po || !proposal || proposal.purchaseOrderId !== poId) {
      throw new Error("Vendor proposal not found");
    }

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        vendorId: proposal.vendorId,
        vendorName: proposal.vendorName,
        selectedVendorId: proposal.vendorId ?? proposal.id,
        selectedVendorName: proposal.vendorName,
        amount: proposal.quotedPrice,
        procurementStatus: PrismaProcurementStatus.POCreated,
        poApprovalRequired: false,
        poApprovalStatus: null,
        updatedAt: new Date(),
      },
    });

    await tx.memo.update({
      where: { id: po.memoId },
      data: {
        procurementStatus: PrismaProcurementStatus.POCreated,
        selectedVendorId: proposal.vendorId ?? proposal.id,
        updatedAt: new Date(),
      },
    });

    await createHistoryEntryTx(tx, {
      purchaseOrderId: poId,
      documentId: poId,
      documentNumber: po.prNumber ?? po.documentNumber,
      documentType: "PR",
      actorId: actor.id,
      actorName: actor.name,
      role: roleFromDb[actor.role],
      action: "Vendor Confirmed",
      comment: comment || `ยืนยัน vendor ${proposal.vendorName}`,
    });
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function receivePurchaseOrder(
  poId: string,
  payload: Omit<ReceivingRecord, "id" | "poId" | "poNumber" | "vendorName">,
) {
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId } });
    if (!po) {
      throw new Error("Purchase order not found");
    }

    const recordId =
      (await tx.receivingRecord.findFirst({ where: { poId }, select: { id: true } }))?.id ??
      `recv-${Date.now()}`;
    const nextStatus = payload.qcRequired ? PrismaProcurementStatus.Received : PrismaProcurementStatus.QCPassed;

    await tx.receivingRecord.upsert({
      where: { id: recordId },
      create: {
        id: recordId,
        poId,
        poNumber: po.poNumber ?? po.documentNumber,
        vendorName: po.selectedVendorName ?? po.vendorName,
        deliveryDate: payload.deliveryDate,
        receivedQty: payload.receivedQty,
        condition: conditionToDb[payload.condition],
        lotNumber: payload.lotNumber,
        batchNumber: payload.batchNumber,
        expiryDate: payload.expiryDate,
        coaMsds: payload.coaMsds,
        qcRequired: payload.qcRequired,
        qcStatus: qcStatusToDb[payload.qcStatus],
        notes: payload.notes,
      },
      update: {
        deliveryDate: payload.deliveryDate,
        receivedQty: payload.receivedQty,
        condition: conditionToDb[payload.condition],
        lotNumber: payload.lotNumber,
        batchNumber: payload.batchNumber,
        expiryDate: payload.expiryDate,
        coaMsds: payload.coaMsds,
        qcRequired: payload.qcRequired,
        qcStatus: qcStatusToDb[payload.qcStatus],
        notes: payload.notes,
      },
    });

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        procurementStatus: nextStatus,
        updatedAt: new Date(),
      },
    });

    await tx.memo.update({
      where: { id: po.memoId },
      data: {
        procurementStatus: nextStatus,
        updatedAt: new Date(),
      },
    });
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function markQcPassed(poId: string) {
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId } });
    const receiving = await tx.receivingRecord.findFirst({ where: { poId } });
    if (!po || !receiving) {
      throw new Error("Receiving record not found");
    }

    await tx.receivingRecord.update({
      where: { id: receiving.id },
      data: {
        qcStatus: PrismaQCStatus.QCPassed,
      },
    });

    await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        procurementStatus: PrismaProcurementStatus.QCPassed,
        updatedAt: new Date(),
      },
    });

    await tx.memo.update({
      where: { id: po.memoId },
      data: {
        procurementStatus: PrismaProcurementStatus.QCPassed,
        updatedAt: new Date(),
      },
    });

    const existingPayment = await tx.paymentRequest.findFirst({ where: { poId } });
    if (existingPayment) {
      await tx.paymentRequest.update({
        where: { id: existingPayment.id },
        data: {
          status: PrismaPaymentStatus.ReadyForAPPosting,
          receivingAmount: receiving.receivedQty,
        },
      });
    } else {
      await tx.paymentRequest.create({
        data: {
          id: `pay-${Date.now()}`,
          poId,
          poNumber: po.poNumber ?? po.documentNumber,
          vendorName: po.selectedVendorName ?? po.vendorName,
          invoiceAmount: po.amount,
          receivingAmount: receiving.receivedQty,
          status: PrismaPaymentStatus.ReadyForAPPosting,
          invoiceUploaded: true,
          createdAt: new Date(),
        },
      });
    }
  });

  return {
    poId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function advancePaymentStatus(paymentId: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.paymentRequest.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error("Payment request not found");
    }

    const nextStatus =
      payment.status === PrismaPaymentStatus.PendingInvoice
        ? PrismaPaymentStatus.ReadyForAPPosting
        : payment.status === PrismaPaymentStatus.ReadyForAPPosting
          ? PrismaPaymentStatus.ApprovedForPayment
          : payment.status === PrismaPaymentStatus.ApprovedForPayment
            ? PrismaPaymentStatus.Paid
            : PrismaPaymentStatus.Paid;

    await tx.paymentRequest.update({
      where: { id: paymentId },
      data: {
        status: nextStatus,
      },
    });
  });

  return {
    paymentId,
    data: await refreshBootstrapFromDbOrFallback(),
  };
}

export async function seedDatabaseFromMockData() {
  ensureDatabaseConfigured();
  const fallback = cloneFallbackData();
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.createMany({
      data: fallback.users.map((user) => ({
        id: user.id,
        name: user.name,
        role: roleToDb[user.role],
        department: user.department,
        site: siteToDb[user.site],
      })),
    });

    await tx.vendor.createMany({
      data: fallback.vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        badge: vendor.badge,
        price: vendor.price,
        leadTime: vendor.leadTime,
        creditTerm: vendor.creditTerm,
        rating: vendor.rating,
        approved: vendor.approved,
      })),
    });

    for (const memo of fallback.memos) {
      await tx.memo.create({
        data: {
          id: memo.id,
          documentNumber: memo.documentNumber,
          requesterId: memo.requesterId,
          requesterName: memo.requesterName,
          department: memo.department,
          site: siteToDb[memo.site],
          costCenter: memo.costCenter,
          requestDate: memo.requestDate,
          requiredDate: memo.requiredDate,
          title: memo.title,
          category: categoryToDb[memo.category],
          purpose: memo.purpose,
          urgency: urgencyToDb[memo.urgency],
          budgetCode: memo.budgetCode,
          deliveryLocation: memo.deliveryLocation,
          attachments: memo.attachments,
          budgetRemaining: memo.budgetRemaining,
          status: memoStatusToDb[memo.status],
          procurementStatus: procurementStatusToDb[memo.procurementStatus],
          assignedApproverId: memo.assignedApproverId,
          currentApproverName: memo.currentApproverName,
          estimatedTotal: memo.estimatedTotal,
          createdAt: new Date(toIsoString(memo.createdAt)),
          updatedAt: new Date(toIsoString(memo.updatedAt)),
          prNumber: memo.prNumber,
          poNumber: memo.poNumber,
          selectedVendorId: memo.selectedVendorId,
          poApprovalStatus: memo.poApprovalStatus ? poApprovalStatusToDb[memo.poApprovalStatus] : undefined,
          poApprovalRequired: memo.poApprovalRequired,
          poAmount: memo.poAmount,
          items: {
            create: memo.items.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              category: categoryToDb[item.category],
            })),
          },
        },
      });

      for (const history of memo.history) {
        await tx.approvalHistory.create({
          data: {
            id: history.id,
            memoId: memo.id,
            documentId: history.documentId,
            documentNumber: history.documentNumber,
            documentType: docTypeToDb[history.documentType],
            actorId: history.actorId,
            actorName: history.actorName,
            role: roleToDb[history.role],
            action: historyActionToDb[history.action],
            comment: history.comment,
            date: new Date(toIsoString(history.date)),
            actionLabelTh: history.actionLabelTh,
          },
        });
      }
    }

    for (const po of fallback.purchaseOrders) {
      await tx.purchaseOrder.create({
        data: {
          id: po.id,
          documentNumber: po.documentNumber,
          memoId: po.memoId,
          memoTitle: po.memoTitle,
          vendorId: po.vendorId ?? null,
          vendorName: po.vendorName,
          procurementStatus: procurementStatusToDb[po.procurementStatus],
          amount: po.amount,
          createdAt: new Date(toIsoString(po.createdAt)),
          updatedAt: new Date(toIsoString(po.updatedAt)),
          sentToVendorAt: po.sentToVendorAt ? new Date(toIsoString(po.sentToVendorAt)) : undefined,
          quoteSelected: po.quoteSelected,
          selectedVendorId: po.selectedVendorId,
          selectedVendorName: po.selectedVendorName,
          poNumber: po.poNumber,
          prNumber: po.prNumber,
          poApprovalStatus: po.poApprovalStatus ? poApprovalStatusToDb[po.poApprovalStatus] : undefined,
          poApprovalRequired: po.poApprovalRequired,
        },
      });

      for (const proposal of po.vendorProposals) {
        await tx.vendorProposal.create({
          data: {
            id: proposal.id,
            purchaseOrderId: po.id,
            vendorId: proposal.vendorId ?? null,
            vendorName: proposal.vendorName,
            quotedPrice: proposal.quotedPrice,
            leadTime: proposal.leadTime,
            paymentTerms: proposal.paymentTerms,
            notes: proposal.notes,
            attachmentName: proposal.attachmentName,
            attachmentUrl: proposal.attachmentUrl,
            submittedToApprover: proposal.submittedToApprover ?? false,
            proposedById: proposal.proposedById,
            proposedByName: proposal.proposedByName,
            createdAt: new Date(toIsoString(proposal.createdAt)),
          },
        });
      }

      for (const history of po.history) {
        await tx.approvalHistory.create({
          data: {
            id: history.id,
            purchaseOrderId: po.id,
            documentId: history.documentId,
            documentNumber: history.documentNumber,
            documentType: docTypeToDb[history.documentType],
            actorId: history.actorId,
            actorName: history.actorName,
            role: roleToDb[history.role],
            action: historyActionToDb[history.action],
            comment: history.comment,
            date: new Date(toIsoString(history.date)),
            actionLabelTh: history.actionLabelTh,
          },
        });
      }
    }

    for (const record of fallback.receivingRecords) {
      await tx.receivingRecord.create({
        data: {
          id: record.id,
          poId: record.poId,
          poNumber: record.poNumber,
          vendorName: record.vendorName,
          deliveryDate: record.deliveryDate,
          receivedQty: record.receivedQty,
          condition: conditionToDb[record.condition],
          lotNumber: record.lotNumber,
          batchNumber: record.batchNumber,
          expiryDate: record.expiryDate,
          coaMsds: record.coaMsds,
          qcRequired: record.qcRequired,
          qcStatus: qcStatusToDb[record.qcStatus],
          notes: record.notes,
        },
      });
    }

    for (const payment of fallback.paymentRequests) {
      await tx.paymentRequest.create({
        data: {
          id: payment.id,
          poId: payment.poId,
          poNumber: payment.poNumber,
          vendorName: payment.vendorName,
          invoiceAmount: payment.invoiceAmount,
          receivingAmount: payment.receivingAmount,
          status: paymentStatusToDb[payment.status],
          invoiceUploaded: payment.invoiceUploaded,
          createdAt: new Date(toIsoString(payment.createdAt)),
        },
      });
    }
  });
}
