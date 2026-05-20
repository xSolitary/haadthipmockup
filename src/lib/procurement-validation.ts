import type { MemoItem, MemoRequest, ReceivingRecord, VendorProposal } from "@/lib/types";

export const PROCUREMENT_LIMITS = {
  attachmentsPerMemo: 10,
  itemsPerMemo: 100,
  itemQuantityMax: 1_000_000,
  unitPriceMax: 10_000_000,
  budgetAmountMax: 1_000_000_000,
  textShortMax: 120,
  textMediumMax: 255,
  textLongMax: 2_000,
} as const;

const siteNames = [
  "Head Office",
  "Hat Yai Plant",
  "Surat Thani Distribution Center",
  "Phuket Sales Office",
  "Nakhon Si Thammarat Depot",
] as const;

const procurementCategories = [
  "Raw Material",
  "Packaging",
  "Spare Parts",
  "Factory Supplies",
  "Marketing / POSM",
  "Fleet / Vehicle",
  "IT / Office",
  "Service / Contractor",
] as const;

const memoUrgencies = ["Normal", "Urgent", "Emergency"] as const;
const poApprovalStatuses = ["Pending", "Approved", "Rejected"] as const;
const receivingConditions = ["Good", "Damaged", "Partial"] as const;
const qcStatuses = ["Pending QC", "QC Passed", "QC Failed", "Quarantine", "Not Required"] as const;

type MutableMemoPayloadLike = Omit<
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

type MutableReceivingPayloadLike = Omit<
  ReceivingRecord,
  "id" | "poId" | "poNumber" | "vendorName"
>;

function assertNonEmptyString(
  value: unknown,
  field: string,
  maxLength: number,
  options: { optional?: boolean } = {},
) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or less`);
  }

  return trimmed;
}

function assertDateString(value: unknown, field: string, options: { optional?: boolean } = {}) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must use YYYY-MM-DD format`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} is invalid`);
  }

  return value;
}

function assertFiniteNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  options: { optional?: boolean } = {},
) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }

  if (value < min || value > max) {
    throw new Error(`${field} must be between ${min} and ${max}`);
  }

  return value;
}

function assertBoolean(value: unknown, field: string, options: { optional?: boolean } = {}) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${field} must be true or false`);
  }

  return value;
}

function assertEnumValue<const T extends readonly string[]>(
  value: unknown,
  field: string,
  allowedValues: T,
  options: { optional?: boolean } = {},
) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "string" || !allowedValues.includes(value)) {
    throw new Error(`${field} is invalid`);
  }

  return value as T[number];
}

function assertStringArray(value: unknown, field: string, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }

  if (value.length > maxItems) {
    throw new Error(`${field} must contain at most ${maxItems} items`);
  }

  return value.map((entry, index) => {
    const validatedEntry = assertNonEmptyString(entry, `${field}[${index}]`, maxLength);
    if (!validatedEntry) {
      throw new Error(`${field}[${index}] is required`);
    }

    return validatedEntry;
  });
}

function validateMemoItems(items: unknown): MemoItem[] {
  if (!Array.isArray(items)) {
    throw new Error("items must be an array");
  }

  if (items.length === 0) {
    throw new Error("At least one item is required");
  }

  if (items.length > PROCUREMENT_LIMITS.itemsPerMemo) {
    throw new Error(`A memo can contain at most ${PROCUREMENT_LIMITS.itemsPerMemo} items`);
  }

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`items[${index}] is invalid`);
    }

    const typedItem = item as MemoItem;
    const name = assertNonEmptyString(
      typedItem.name,
      `items[${index}].name`,
      PROCUREMENT_LIMITS.textMediumMax,
    );
    const quantity = assertFiniteNumber(
      typedItem.quantity,
      `items[${index}].quantity`,
      0.0001,
      PROCUREMENT_LIMITS.itemQuantityMax,
    );
    const unit = assertNonEmptyString(
      typedItem.unit,
      `items[${index}].unit`,
      PROCUREMENT_LIMITS.textShortMax,
    );
    const unitPrice = assertFiniteNumber(
      typedItem.unitPrice,
      `items[${index}].unitPrice`,
      0,
      PROCUREMENT_LIMITS.unitPriceMax,
    );
    const category = assertEnumValue(
      typedItem.category,
      `items[${index}].category`,
      procurementCategories,
    );

    if (!name || quantity === undefined || !unit || unitPrice === undefined || !category) {
      throw new Error(`items[${index}] is invalid`);
    }

    return {
      ...typedItem,
      name,
      quantity,
      unit,
      unitPrice,
      category,
    };
  });
}

export function validateMemoPayload(
  payload: MutableMemoPayloadLike | Partial<MutableMemoPayloadLike>,
  options: { partial?: boolean } = {},
) {
  const partial = options.partial ?? false;
  const validated = { ...payload };

  if (!partial || payload.requesterId !== undefined) {
    validated.requesterId = assertNonEmptyString(
      payload.requesterId,
      "requesterId",
      PROCUREMENT_LIMITS.textShortMax,
    );
  }

  if (!partial || payload.requesterName !== undefined) {
    validated.requesterName = assertNonEmptyString(
      payload.requesterName,
      "requesterName",
      PROCUREMENT_LIMITS.textMediumMax,
    );
  }

  if (!partial || payload.department !== undefined) {
    validated.department = assertNonEmptyString(
      payload.department,
      "department",
      PROCUREMENT_LIMITS.textShortMax,
    );
  }

  if (!partial || payload.costCenter !== undefined) {
    validated.costCenter = assertNonEmptyString(
      payload.costCenter,
      "costCenter",
      PROCUREMENT_LIMITS.textShortMax,
    );
  }

  if (!partial || payload.site !== undefined) {
    validated.site = assertEnumValue(payload.site, "site", siteNames);
  }

  if (!partial || payload.requestDate !== undefined) {
    validated.requestDate = assertDateString(payload.requestDate, "requestDate");
  }

  if (!partial || payload.requiredDate !== undefined) {
    validated.requiredDate = assertDateString(payload.requiredDate, "requiredDate");
  }

  if (validated.requestDate && validated.requiredDate && validated.requiredDate < validated.requestDate) {
    throw new Error("requiredDate must be on or after requestDate");
  }

  if (!partial || payload.title !== undefined) {
    validated.title = assertNonEmptyString(payload.title, "title", PROCUREMENT_LIMITS.textMediumMax);
  }

  if (!partial || payload.category !== undefined) {
    validated.category = assertEnumValue(payload.category, "category", procurementCategories);
  }

  if (!partial || payload.purpose !== undefined) {
    validated.purpose = assertNonEmptyString(payload.purpose, "purpose", PROCUREMENT_LIMITS.textLongMax);
  }

  if (!partial || payload.budgetCode !== undefined) {
    validated.budgetCode = assertNonEmptyString(
      payload.budgetCode,
      "budgetCode",
      PROCUREMENT_LIMITS.textShortMax,
    );
  }

  if (!partial || payload.urgency !== undefined) {
    validated.urgency = assertEnumValue(payload.urgency, "urgency", memoUrgencies);
  }

  if (!partial || payload.deliveryLocation !== undefined) {
    validated.deliveryLocation = assertNonEmptyString(
      payload.deliveryLocation,
      "deliveryLocation",
      PROCUREMENT_LIMITS.textMediumMax,
    );
  }

  if (!partial || payload.attachments !== undefined) {
    validated.attachments = assertStringArray(
      payload.attachments,
      "attachments",
      PROCUREMENT_LIMITS.attachmentsPerMemo,
      PROCUREMENT_LIMITS.textMediumMax,
    );
  }

  if (!partial || payload.budgetRemaining !== undefined) {
    validated.budgetRemaining = assertFiniteNumber(
      payload.budgetRemaining,
      "budgetRemaining",
      0,
      PROCUREMENT_LIMITS.budgetAmountMax,
    );
  }

  if (!partial || payload.poAmount !== undefined) {
    validated.poAmount = assertFiniteNumber(
      payload.poAmount,
      "poAmount",
      0,
      PROCUREMENT_LIMITS.budgetAmountMax,
      { optional: true },
    );
  }

  if (!partial || payload.poApprovalStatus !== undefined) {
    validated.poApprovalStatus = assertEnumValue(
      payload.poApprovalStatus,
      "poApprovalStatus",
      poApprovalStatuses,
      { optional: true },
    );
  }

  if (!partial || payload.poApprovalRequired !== undefined) {
    validated.poApprovalRequired = assertBoolean(
      payload.poApprovalRequired,
      "poApprovalRequired",
      { optional: true },
    );
  }

  if (!partial || payload.items !== undefined) {
    validated.items = validateMemoItems(payload.items);
    const estimatedTotal = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    if (estimatedTotal > PROCUREMENT_LIMITS.budgetAmountMax) {
      throw new Error(`estimatedTotal must not exceed ${PROCUREMENT_LIMITS.budgetAmountMax}`);
    }
  }

  return validated;
}

export function validateVendorProposalPayload(
  payload: VendorProposal | Omit<VendorProposal, "id" | "proposedById" | "proposedByName" | "createdAt"> | Partial<VendorProposal>,
  options: { partial?: boolean } = {},
) {
  const partial = options.partial ?? false;
  const validated = { ...payload };

  if (!partial || payload.vendorName !== undefined) {
    validated.vendorName = assertNonEmptyString(
      payload.vendorName,
      "vendorName",
      PROCUREMENT_LIMITS.textMediumMax,
    );
  }

  if (!partial || payload.quotedPrice !== undefined) {
    validated.quotedPrice = assertFiniteNumber(
      payload.quotedPrice,
      "quotedPrice",
      0,
      PROCUREMENT_LIMITS.budgetAmountMax,
    );
  }

  if (!partial || payload.leadTime !== undefined) {
    validated.leadTime = assertNonEmptyString(
      payload.leadTime,
      "leadTime",
      PROCUREMENT_LIMITS.textShortMax,
    );
  }

  if (!partial || payload.paymentTerms !== undefined) {
    validated.paymentTerms = assertNonEmptyString(
      payload.paymentTerms,
      "paymentTerms",
      PROCUREMENT_LIMITS.textShortMax,
    );
  }

  if (!partial || payload.notes !== undefined) {
    validated.notes = assertNonEmptyString(payload.notes, "notes", PROCUREMENT_LIMITS.textLongMax);
  }

  if (!partial || payload.attachmentName !== undefined) {
    validated.attachmentName =
      payload.attachmentName == null || payload.attachmentName === ""
        ? undefined
        : assertNonEmptyString(
            payload.attachmentName,
            "attachmentName",
            PROCUREMENT_LIMITS.textMediumMax,
          );
  }

  if (!partial || payload.attachmentUrl !== undefined) {
    validated.attachmentUrl =
      payload.attachmentUrl == null || payload.attachmentUrl === ""
        ? undefined
        : assertNonEmptyString(
            payload.attachmentUrl,
            "attachmentUrl",
            PROCUREMENT_LIMITS.textLongMax,
          );
  }

  if (!partial || payload.submittedToApprover !== undefined) {
    validated.submittedToApprover = assertBoolean(
      payload.submittedToApprover,
      "submittedToApprover",
      { optional: true },
    );
  }

  return validated;
}

export function validateReceivingPayload(payload: MutableReceivingPayloadLike) {
  const deliveryDate = assertDateString(payload.deliveryDate, "deliveryDate");
  const receivedQty = assertFiniteNumber(
    payload.receivedQty,
    "receivedQty",
    0.0001,
    PROCUREMENT_LIMITS.itemQuantityMax,
  );
  const lotNumber = assertNonEmptyString(
    payload.lotNumber,
    "lotNumber",
    PROCUREMENT_LIMITS.textShortMax,
  );
  const batchNumber = assertNonEmptyString(
    payload.batchNumber,
    "batchNumber",
    PROCUREMENT_LIMITS.textShortMax,
  );
  const expiryDate = assertDateString(payload.expiryDate, "expiryDate");
  const coaMsds = assertBoolean(payload.coaMsds, "coaMsds");
  const qcRequired = assertBoolean(payload.qcRequired, "qcRequired");
  const notes = assertNonEmptyString(payload.notes, "notes", PROCUREMENT_LIMITS.textLongMax);

  if (
    !deliveryDate ||
    receivedQty === undefined ||
    !lotNumber ||
    !batchNumber ||
    !expiryDate ||
    coaMsds === undefined ||
    qcRequired === undefined ||
    !notes
  ) {
    throw new Error("Receiving payload is invalid");
  }

  const condition = assertEnumValue(payload.condition, "condition", receivingConditions);
  const qcStatus = assertEnumValue(payload.qcStatus, "qcStatus", qcStatuses);

  if (expiryDate < deliveryDate) {
    throw new Error("expiryDate must be on or after deliveryDate");
  }

  if (qcRequired && qcStatus === "Not Required") {
    throw new Error("qcStatus cannot be 'Not Required' when qcRequired is true");
  }

  if (!qcRequired && qcStatus !== "Not Required") {
    throw new Error("qcStatus must be 'Not Required' when qcRequired is false");
  }

  return {
    ...payload,
    deliveryDate,
    receivedQty,
    condition,
    lotNumber,
    batchNumber,
    expiryDate,
    coaMsds,
    qcRequired,
    qcStatus,
    notes,
  };
}
