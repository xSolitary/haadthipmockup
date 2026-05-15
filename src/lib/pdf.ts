import type { MemoRequest, PurchaseOrder, VendorProposal } from "@/lib/types";

type PdfItemRow = {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

type PdfField = {
  label: string;
  value: string;
};

const PAGE_MARGIN = 36;
const LABEL_WIDTH = 118;
const CONTENT_WIDTH = 595.28 - PAGE_MARGIN * 2;
const METADATA_LINE_HEIGHT = 18;
const BODY_FONT_SIZE = 10;
const TABLE_FONT_SIZE = 10;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
};

const normalizeText = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
};

const containsMojibake = (value: string) =>
  /(?:Ã.|Â.|à¸|à¹|ðŸ|�|ï¿½|€™|â€¢|â€œ|â€\u009d|â€“|â€”)/.test(value);

const stripUnsafeText = (value: string) =>
  value
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sanitizePdfText = (
  value: string | null | undefined,
  fallback: string,
  options?: { maxLength?: number },
) => {
  const normalized = normalizeText(value);
  if (!normalized) return fallback;

  const stripped = containsMojibake(normalized) ? stripUnsafeText(normalized) : normalized;
  const asciiSafe = stripUnsafeText(stripped);
  if (!asciiSafe) return fallback;

  if (options?.maxLength && asciiSafe.length > options.maxLength) {
    return `${asciiSafe.slice(0, options.maxLength).trimEnd()}...`;
  }

  return asciiSafe;
};

const sanitizeFilenameSegment = (value: string | null | undefined, fallback: string) => {
  const safe = sanitizePdfText(value, fallback).replace(/[^A-Za-z0-9_-]/g, "-");
  return safe.replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
};

const sanitizeDepartmentSite = (memo: MemoRequest | null) => {
  const department = sanitizePdfText(memo?.department, "Hat Yai Plant");
  const site = sanitizePdfText(memo?.site, "Hat Yai Plant");
  return department === site ? department : `${department} / ${site}`;
};

const sanitizeHistoryComment = (value?: string | null) => sanitizePdfText(value, "-", { maxLength: 120 });

const buildItems = (purchaseOrder: PurchaseOrder, memo: MemoRequest | null): PdfItemRow[] => {
  const memoItems = memo?.items ?? [];
  if (memoItems.length > 0) {
    return memoItems.map((item, index) => ({
      name: sanitizePdfText(item.name, `Item ${index + 1}`),
      quantity: item.quantity,
      unit: sanitizePdfText(item.unit, "Unit"),
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
  }

  return [
    {
      name: sanitizePdfText(purchaseOrder.memoTitle, "Item 1"),
      quantity: 1,
      unit: "Lot",
      unitPrice: purchaseOrder.amount,
      total: purchaseOrder.amount,
    },
  ];
};

const getSelectedProposal = (purchaseOrder: PurchaseOrder): VendorProposal | null =>
  purchaseOrder.vendorProposals.find((proposal) => proposal.vendorName === purchaseOrder.selectedVendorName) ??
  purchaseOrder.vendorProposals[0] ??
  null;

const addFieldBlock = (doc: import("jspdf").jsPDF, fields: PdfField[], startY: number) => {
  let y = startY;
  const valueX = PAGE_MARGIN + LABEL_WIDTH;
  const valueWidth = CONTENT_WIDTH - LABEL_WIDTH;

  doc.setFontSize(BODY_FONT_SIZE);

  fields.forEach((field) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(90, 102, 118);
    doc.text(`${field.label}:`, PAGE_MARGIN, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(field.value, valueWidth);
    doc.text(lines, valueX, y);
    y += Math.max(METADATA_LINE_HEIGHT, lines.length * 12 + 6);
  });

  return y;
};

const addSectionTitle = (doc: import("jspdf").jsPDF, title: string, y: number) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(title, PAGE_MARGIN, y);
  return y + 10;
};

async function createBaseDocument(title: string) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, PAGE_MARGIN, 40);
  doc.setDrawColor(0, 121, 70);
  doc.setLineWidth(1.2);
  doc.line(PAGE_MARGIN, 50, doc.internal.pageSize.getWidth() - PAGE_MARGIN, 50);

  return { doc, autoTable };
}

const tableStyles = {
  font: "helvetica" as const,
  fontSize: TABLE_FONT_SIZE,
  cellPadding: 3,
  textColor: [15, 23, 42] as [number, number, number],
  overflow: "linebreak" as const,
  lineWidth: 0.1,
  valign: "top" as const,
};

export async function downloadPrPdf(purchaseOrder: PurchaseOrder, memo: MemoRequest | null) {
  const { doc, autoTable } = await createBaseDocument("Purchase Requisition (PR)");
  const prNumber = sanitizePdfText(purchaseOrder.prNumber ?? purchaseOrder.documentNumber, "PR-Document");
  const items = buildItems(purchaseOrder, memo);
  const totalAmount = memo?.estimatedTotal ?? purchaseOrder.amount;

  let cursorY = addFieldBlock(
    doc,
    [
      { label: "PR No", value: prNumber },
      { label: "Memo No", value: sanitizePdfText(memo?.documentNumber, "-") },
      { label: "Requester", value: sanitizePdfText(memo?.requesterName, "Requester") },
      { label: "Department/Site", value: sanitizeDepartmentSite(memo) },
      { label: "Date", value: formatDate(memo?.requestDate ?? purchaseOrder.createdAt) },
      { label: "Status", value: sanitizePdfText(purchaseOrder.procurementStatus, "Open") },
    ],
    72,
  );

  cursorY = addSectionTitle(doc, "Items", cursorY + 10);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["Item Name", "Qty", "Unit", "Unit Price", "Total"]],
    body: items.map((item) => [
      item.name,
      item.quantity.toLocaleString("en-US"),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.total),
    ]),
    theme: "grid",
    styles: tableStyles,
    headStyles: { fillColor: [0, 121, 70], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 215 },
      1: { cellWidth: 48, halign: "right" },
      2: { cellWidth: 56 },
      3: { cellWidth: 98, halign: "right" },
      4: { cellWidth: 106, halign: "right" },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, doc.internal.pageSize.getWidth() - PAGE_MARGIN, cursorY, {
    align: "right",
  });

  if (purchaseOrder.history.length > 0) {
    cursorY = addSectionTitle(doc, "Approval History", cursorY + 24);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [["Date", "Action", "Actor", "Role", "Comment"]],
      body: purchaseOrder.history.map((entry) => [
        formatDate(entry.date),
        sanitizePdfText(entry.action, "Update"),
        sanitizePdfText(entry.actorName, "User"),
        sanitizePdfText(entry.role, "-"),
        sanitizeHistoryComment(entry.comment),
      ]),
      theme: "grid",
      styles: tableStyles,
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 66 },
        1: { cellWidth: 86 },
        2: { cellWidth: 84 },
        3: { cellWidth: 62 },
        4: { cellWidth: 171 },
      },
    });
  }

  doc.save(`PR-${sanitizeFilenameSegment(prNumber, "document")}.pdf`);
}

export async function downloadPoPdf(purchaseOrder: PurchaseOrder, memo: MemoRequest | null) {
  const { doc, autoTable } = await createBaseDocument("Purchase Order (PO)");
  const poNumber = sanitizePdfText(purchaseOrder.poNumber ?? purchaseOrder.documentNumber, "PO-Document");
  const prNumber = sanitizePdfText(purchaseOrder.prNumber ?? purchaseOrder.documentNumber, "PR-Document");
  const items = buildItems(purchaseOrder, memo);
  const totalAmount = purchaseOrder.amount;
  const selectedProposal = getSelectedProposal(purchaseOrder);

  let cursorY = addFieldBlock(
    doc,
    [
      { label: "PO No", value: poNumber },
      { label: "PR No", value: prNumber },
      { label: "Vendor", value: sanitizePdfText(purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName, "Vendor") },
      { label: "Department/Site", value: sanitizeDepartmentSite(memo) },
      { label: "Date", value: formatDate(purchaseOrder.updatedAt || purchaseOrder.createdAt) },
      { label: "Status", value: sanitizePdfText(purchaseOrder.procurementStatus, "Open") },
    ],
    72,
  );

  cursorY = addSectionTitle(doc, "Items", cursorY + 10);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["Item Name", "Qty", "Unit", "Unit Price", "Total"]],
    body: items.map((item) => [
      item.name,
      item.quantity.toLocaleString("en-US"),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.total),
    ]),
    theme: "grid",
    styles: tableStyles,
    headStyles: { fillColor: [0, 121, 70], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 215 },
      1: { cellWidth: 48, halign: "right" },
      2: { cellWidth: 56 },
      3: { cellWidth: 98, halign: "right" },
      4: { cellWidth: 106, halign: "right" },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, doc.internal.pageSize.getWidth() - PAGE_MARGIN, cursorY, {
    align: "right",
  });

  cursorY = addSectionTitle(doc, "Selected Vendor Info", cursorY + 24);
  autoTable(doc, {
    startY: cursorY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [["Vendor", "Quoted Price", "Lead Time", "Payment Term", "Notes"]],
    body: [
      [
        sanitizePdfText(purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName, "Vendor"),
        formatCurrency(selectedProposal?.quotedPrice ?? purchaseOrder.amount),
        sanitizePdfText(selectedProposal?.leadTime, "-"),
        sanitizePdfText(selectedProposal?.paymentTerms, "-"),
        sanitizePdfText(selectedProposal?.notes, "-", { maxLength: 120 }),
      ],
    ],
    theme: "grid",
    styles: tableStyles,
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 92, halign: "right" },
      2: { cellWidth: 82 },
      3: { cellWidth: 98 },
      4: { cellWidth: 131 },
    },
  });

  if (purchaseOrder.history.length > 0) {
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY) + 24;
    cursorY = addSectionTitle(doc, "Approval History", cursorY);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      head: [["Date", "Action", "Actor", "Role", "Comment"]],
      body: purchaseOrder.history.map((entry) => [
        formatDate(entry.date),
        sanitizePdfText(entry.action, "Update"),
        sanitizePdfText(entry.actorName, "User"),
        sanitizePdfText(entry.role, "-"),
        sanitizeHistoryComment(entry.comment),
      ]),
      theme: "grid",
      styles: tableStyles,
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 66 },
        1: { cellWidth: 86 },
        2: { cellWidth: 84 },
        3: { cellWidth: 62 },
        4: { cellWidth: 171 },
      },
    });
  }

  doc.save(`PO-${sanitizeFilenameSegment(poNumber, "document")}.pdf`);
}
