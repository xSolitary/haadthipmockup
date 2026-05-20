-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Requester', 'Approver', 'Purchasing', 'Finance', 'Admin');

-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('Draft', 'PendingApproval', 'Approved', 'Rejected', 'RevisionRequired', 'ConvertedToPR');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('NotStarted', 'PRCreated', 'WaitingForPurchasingToProposeVendors', 'PendingPRApproval', 'PendingVendorApproval', 'VendorApproved', 'POCreated', 'SentToVendor', 'PendingReceiving', 'Received', 'QCPassed', 'PaymentPending', 'Closed', 'VendorSelected', 'PendingPOApproval', 'POApproved', 'PORejected', 'Receiving', 'QCPending');

-- CreateEnum
CREATE TYPE "ProcurementCategory" AS ENUM ('RawMaterial', 'Packaging', 'SpareParts', 'FactorySupplies', 'MarketingPOSM', 'FleetVehicle', 'ITOffice', 'ServiceContractor');

-- CreateEnum
CREATE TYPE "SiteName" AS ENUM ('HeadOffice', 'HatYaiPlant', 'SuratThaniDistributionCenter', 'PhuketSalesOffice', 'NakhonSiThammaratDepot');

-- CreateEnum
CREATE TYPE "MemoUrgency" AS ENUM ('Normal', 'Urgent', 'Emergency');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('Memo', 'PR', 'PO');

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('Approved', 'Rejected', 'RevisionRequired', 'Submitted', 'Resubmitted', 'DraftSaved', 'VendorProposed', 'SubmittedForVendorApproval', 'VendorConfirmed');

-- CreateEnum
CREATE TYPE "ReceivingCondition" AS ENUM ('Good', 'Damaged', 'Partial');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PendingQC', 'QCPassed', 'QCFailed', 'Quarantine', 'NotRequired');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PendingInvoice', 'ReadyForAPPosting', 'ApprovedForPayment', 'Paid');

-- CreateEnum
CREATE TYPE "POApprovalStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT NOT NULL,
    "site" "SiteName" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "site" "SiteName" NOT NULL,
    "costCenter" TEXT NOT NULL,
    "requestDate" TEXT NOT NULL,
    "requiredDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ProcurementCategory" NOT NULL,
    "purpose" TEXT NOT NULL,
    "urgency" "MemoUrgency" NOT NULL,
    "budgetCode" TEXT NOT NULL,
    "deliveryLocation" TEXT NOT NULL,
    "attachments" TEXT[],
    "budgetRemaining" DOUBLE PRECISION NOT NULL,
    "status" "MemoStatus" NOT NULL,
    "procurementStatus" "ProcurementStatus" NOT NULL,
    "assignedApproverId" TEXT NOT NULL,
    "currentApproverName" TEXT NOT NULL,
    "estimatedTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prNumber" TEXT,
    "poNumber" TEXT,
    "selectedVendorId" TEXT,
    "poApprovalStatus" "POApprovalStatus",
    "poApprovalRequired" BOOLEAN,
    "poAmount" DOUBLE PRECISION,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoItem" (
    "id" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "category" "ProcurementCategory" NOT NULL,

    CONSTRAINT "MemoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "memoId" TEXT,
    "purchaseOrderId" TEXT,
    "documentId" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "action" "HistoryAction" NOT NULL,
    "comment" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "actionLabelTh" TEXT NOT NULL,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "leadTime" TEXT NOT NULL,
    "creditTerm" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "approved" BOOLEAN NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "memoId" TEXT NOT NULL,
    "memoTitle" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "procurementStatus" "ProcurementStatus" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentToVendorAt" TIMESTAMP(3),
    "quoteSelected" TEXT,
    "selectedVendorId" TEXT,
    "selectedVendorName" TEXT,
    "poNumber" TEXT,
    "prNumber" TEXT,
    "poApprovalStatus" "POApprovalStatus",
    "poApprovalRequired" BOOLEAN,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProposal" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "quotedPrice" DOUBLE PRECISION NOT NULL,
    "leadTime" TEXT NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "attachmentName" TEXT,
    "attachmentUrl" TEXT,
    "submittedToApprover" BOOLEAN NOT NULL DEFAULT false,
    "proposedById" TEXT NOT NULL,
    "proposedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivingRecord" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "deliveryDate" TEXT NOT NULL,
    "receivedQty" DOUBLE PRECISION NOT NULL,
    "condition" "ReceivingCondition" NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "coaMsds" BOOLEAN NOT NULL,
    "qcRequired" BOOLEAN NOT NULL,
    "qcStatus" "QCStatus" NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "ReceivingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "invoiceAmount" DOUBLE PRECISION NOT NULL,
    "receivingAmount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "invoiceUploaded" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Memo_documentNumber_key" ON "Memo"("documentNumber");

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_assignedApproverId_fkey" FOREIGN KEY ("assignedApproverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoItem" ADD CONSTRAINT "MemoItem_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProposal" ADD CONSTRAINT "VendorProposal_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProposal" ADD CONSTRAINT "VendorProposal_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProposal" ADD CONSTRAINT "VendorProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivingRecord" ADD CONSTRAINT "ReceivingRecord_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
