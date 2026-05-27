import type { MemoItem, MemoRequest, ReceivingRecord, VendorProposal } from "@/lib/types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const PROCUREMENT_LIMITS = {
  attachmentsPerMemo: 10,
  itemsPerMemo: 100,
  itemQuantityMax: 1_000_000,
  unitPriceMax: 10_000_000,
  memoEstimatedTotalMax: 1_000_000,
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

function failValidation(message: string): never {
  throw new ValidationError(message);
}

function formatCurrencyAmount(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addOneYear(dateString: string) {
  const parsed = new Date(`${dateString}T00:00:00.000Z`);
  parsed.setUTCFullYear(parsed.getUTCFullYear() + 1);
  return parsed.toISOString().slice(0, 10);
}

function getFieldLabel(field: string) {
  if (field.includes("unitPrice") || field === "quotedPrice" || field === "poAmount") {
    return "ราคา";
  }

  if (field.includes("quantity") || field === "receivedQty") {
    return "จำนวน";
  }

  if (field === "budgetRemaining") {
    return "งบคงเหลือ";
  }

  if (field === "requiredDate") {
    return "วันที่ต้องการใช้";
  }

  if (field === "requestDate") {
    return "วันที่ขอ";
  }

  if (field === "deliveryDate") {
    return "วันที่ส่งมอบ";
  }

  if (field === "expiryDate") {
    return "วันหมดอายุ";
  }

  if (field.includes("name") || field === "vendorName" || field === "title") {
    return "ข้อมูลที่กรอก";
  }

  return "ข้อมูล";
}

function createRetryMessage(field: string) {
  return `${getFieldLabel(field)}ไม่ถูกต้อง โปรดใส่ใหม่`;
}

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
    failValidation(createRetryMessage(field));
  }

  const trimmed = value.trim();
  if (!trimmed) {
    failValidation(createRetryMessage(field));
  }

  if (trimmed.length > maxLength) {
    failValidation(createRetryMessage(field));
  }

  return trimmed;
}

function assertDateString(value: unknown, field: string, options: { optional?: boolean } = {}) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    failValidation(createRetryMessage(field));
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    failValidation(createRetryMessage(field));
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
    failValidation(createRetryMessage(field));
  }

  const normalizedValue =
    field.includes("unitPrice") || field === "quotedPrice" || field === "poAmount"
      ? roundCurrency(value)
      : value;

  if (value > PROCUREMENT_LIMITS.unitPriceMax && (field.includes("unitPrice") || field === "quotedPrice")) {
    failValidation(`ราคาเกิน ${formatCurrencyAmount(PROCUREMENT_LIMITS.unitPriceMax)} บาท โปรดใส่ใหม่`);
  }

  if (normalizedValue < min || normalizedValue > max) {
    failValidation(createRetryMessage(field));
  }

  return normalizedValue;
}

function assertBoolean(value: unknown, field: string, options: { optional?: boolean } = {}) {
  if (value == null && options.optional) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    failValidation(createRetryMessage(field));
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
    failValidation(createRetryMessage(field));
  }

  return value as T[number];
}

function assertStringArray(value: unknown, field: string, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) {
    failValidation(createRetryMessage(field));
  }

  if (value.length > maxItems) {
    failValidation(createRetryMessage(field));
  }

  return value.map((entry, index) => {
    const validatedEntry = assertNonEmptyString(entry, `${field}[${index}]`, maxLength);
    if (!validatedEntry) {
      failValidation(createRetryMessage(`${field}[${index}]`));
    }

    return validatedEntry;
  });
}

function validateMemoItems(items: unknown): MemoItem[] {
  if (!Array.isArray(items)) {
    failValidation("รายการสินค้าไม่ถูกต้อง โปรดใส่ใหม่");
  }

  if (items.length === 0) {
    failValidation("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
  }

  if (items.length > PROCUREMENT_LIMITS.itemsPerMemo) {
    failValidation(`รายการสินค้าเกิน ${PROCUREMENT_LIMITS.itemsPerMemo} รายการ โปรดใส่ใหม่`);
  }

  return items.map((item, index) => {
    if (!item || typeof item !== "object") {
      failValidation(`รายการที่ ${index + 1} ไม่ถูกต้อง โปรดใส่ใหม่`);
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
      1,
      PROCUREMENT_LIMITS.itemQuantityMax,
    );
    if (!Number.isInteger(quantity)) {
      failValidation("จำนวนต้องเป็นจำนวนเต็ม โปรดใส่ใหม่");
    }
    const unit = assertNonEmptyString(
      typedItem.unit,
      `items[${index}].unit`,
      PROCUREMENT_LIMITS.textShortMax,
    );
    const unitPrice = assertFiniteNumber(
      typedItem.unitPrice,
      `items[${index}].unitPrice`,
      0.01,
      PROCUREMENT_LIMITS.unitPriceMax,
    );
    const category = assertEnumValue(
      typedItem.category,
      `items[${index}].category`,
      procurementCategories,
    );

    if (!name || quantity === undefined || !unit || unitPrice === undefined || !category) {
      failValidation(`รายการที่ ${index + 1} ไม่ถูกต้อง โปรดใส่ใหม่`);
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
    failValidation("วันที่ต้องการใช้ต้องไม่น้อยกว่าวันที่ขอ โปรดใส่ใหม่");
  }

  if (
    validated.requestDate &&
    validated.requiredDate &&
    validated.requiredDate > addOneYear(validated.requestDate)
  ) {
    failValidation("วันที่ต้องการใช้ต้องไม่เกิน 1 ปีนับจากวันที่ขอ โปรดใส่ใหม่");
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

    if (estimatedTotal > PROCUREMENT_LIMITS.memoEstimatedTotalMax) {
      failValidation(
        `มูลค่ารวมต้องไม่เกิน ${formatCurrencyAmount(PROCUREMENT_LIMITS.memoEstimatedTotalMax)} บาท โปรดใส่ใหม่`,
      );
    }

    if (estimatedTotal > PROCUREMENT_LIMITS.budgetAmountMax) {
      failValidation(
        `มูลค่ารวมเกิน ${formatCurrencyAmount(PROCUREMENT_LIMITS.budgetAmountMax)} บาท โปรดใส่ใหม่`,
      );
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
      0.01,
      PROCUREMENT_LIMITS.budgetAmountMax,
    );
  }

  if (!partial || payload.leadTime !== undefined) {
    validated.leadTime = assertNonEmptyString(
      payload.leadTime,
      "leadTime",
      PROCUREMENT_LIMITS.textShortMax,
    );

    if (validated.leadTime && /^-\d/.test(validated.leadTime.trim())) {
      failValidation("Lead time ต้องไม่ติดลบ โปรดใส่ใหม่");
    }
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
    failValidation("ข้อมูลการรับของไม่ถูกต้อง โปรดใส่ใหม่");
  }

  const condition = assertEnumValue(payload.condition, "condition", receivingConditions);
  const qcStatus = assertEnumValue(payload.qcStatus, "qcStatus", qcStatuses);

  if (expiryDate < deliveryDate) {
    failValidation("วันหมดอายุต้องไม่น้อยกว่าวันที่ส่งมอบ โปรดใส่ใหม่");
  }

  if (qcRequired && qcStatus === "Not Required") {
    failValidation("สถานะ QC ไม่ถูกต้อง โปรดใส่ใหม่");
  }

  if (!qcRequired && qcStatus !== "Not Required") {
    failValidation("สถานะ QC ไม่ถูกต้อง โปรดใส่ใหม่");
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
