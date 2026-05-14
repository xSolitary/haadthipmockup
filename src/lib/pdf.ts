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
const TABLE_FONT_SIZE = 9;

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
  if (!value) return "-";
  return value.replace(/\s+/g, " ").trim() || "-";
};

const containsMojibake = (value: string) => /(à¸|à¹|Ã.|Â.|â.|¤|�)/.test(value);

const sanitizeDisplayText = (value?: string | null, options?: { maxLength?: number }) => {
  const normalized = normalizeText(value);
  if (normalized === "-" || containsMojibake(normalized)) {
    return "-";
  }

  if (options?.maxLength && normalized.length > options.maxLength) {
    return `${normalized.slice(0, options.maxLength).trimEnd()}...`;
  }

  return normalized;
};

const buildItems = (purchaseOrder: PurchaseOrder, memo: MemoRequest | null): PdfItemRow[] => {
  const memoItems = memo?.items ?? [];
  if (memoItems.length > 0) {
    return memoItems.map((item) => ({
      name: sanitizeDisplayText(item.name),
      quantity: item.quantity,
      unit: sanitizeDisplayText(item.unit),
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
  }

  return [
    {
      name: sanitizeDisplayText(purchaseOrder.memoTitle),
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
    const lines = doc.splitTextToSize(sanitizeDisplayText(field.value), valueWidth);
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

export async function downloadPrPdf(purchaseOrder: PurchaseOrder, memo: MemoRequest | null) {
  const { doc, autoTable } = await createBaseDocument("Purchase Requisition (PR)");
  const prNumber = purchaseOrder.prNumber ?? purchaseOrder.documentNumber;
  const items = buildItems(purchaseOrder, memo);
  const totalAmount = memo?.estimatedTotal ?? purchaseOrder.amount;

  let cursorY = addFieldBlock(
    doc,
    [
      { label: "PR No.", value: prNumber },
      { label: "Memo No.", value: memo?.documentNumber ?? "-" },
      { label: "Requester", value: memo?.requesterName ?? "-" },
      { label: "Department / Site", value: `${memo?.department ?? "-"} / ${memo?.site ?? "-"}` },
      { label: "Date", value: formatDate(memo?.requestDate ?? purchaseOrder.createdAt) },
      { label: "Status", value: purchaseOrder.procurementStatus },
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
    styles: {
      font: "helvetica",
      fontSize: TABLE_FONT_SIZE,
      cellPadding: 3,
      textColor: [15, 23, 42],
      overflow: "linebreak",
      lineWidth: 0.1,
      valign: "top",
    },
    headStyles: { fillColor: [0, 121, 70], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { cellWidth: 48, halign: "right" },
      2: { cellWidth: 56 },
      3: { cellWidth: 96, halign: "right" },
      4: { cellWidth: 96, halign: "right" },
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
        sanitizeDisplayText(entry.actionLabelTh || entry.action),
        sanitizeDisplayText(entry.actorName),
        sanitizeDisplayText(entry.role),
        sanitizeDisplayText(entry.comment, { maxLength: 120 }),
      ]),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: TABLE_FONT_SIZE,
        cellPadding: 3,
        textColor: [15, 23, 42],
        overflow: "linebreak",
        lineWidth: 0.1,
        valign: "top",
      },
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 62 },
        1: { cellWidth: 78 },
        2: { cellWidth: 78 },
        3: { cellWidth: 56 },
        4: { cellWidth: 193 },
      },
    });
  }

  doc.save(`PR-${prNumber}.pdf`);
}

export async function downloadPoPdf(purchaseOrder: PurchaseOrder, memo: MemoRequest | null) {
  const { doc, autoTable } = await createBaseDocument("Purchase Order (PO)");
  const poNumber = purchaseOrder.poNumber ?? purchaseOrder.documentNumber;
  const prNumber = purchaseOrder.prNumber ?? purchaseOrder.documentNumber;
  const items = buildItems(purchaseOrder, memo);
  const totalAmount = purchaseOrder.amount;
  const selectedProposal = getSelectedProposal(purchaseOrder);

  let cursorY = addFieldBlock(
    doc,
    [
      { label: "PO No.", value: poNumber },
      { label: "PR No.", value: prNumber },
      { label: "Vendor Name", value: purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName },
      { label: "Department / Site", value: `${memo?.department ?? "-"} / ${memo?.site ?? "-"}` },
      { label: "Delivery Location", value: memo?.deliveryLocation ?? "-" },
      { label: "Payment Term", value: selectedProposal?.paymentTerms ?? "-" },
      { label: "Date", value: formatDate(purchaseOrder.updatedAt || purchaseOrder.createdAt) },
      { label: "Status", value: purchaseOrder.procurementStatus },
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
    styles: {
      font: "helvetica",
      fontSize: TABLE_FONT_SIZE,
      cellPadding: 3,
      textColor: [15, 23, 42],
      overflow: "linebreak",
      lineWidth: 0.1,
      valign: "top",
    },
    headStyles: { fillColor: [0, 121, 70], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { cellWidth: 48, halign: "right" },
      2: { cellWidth: 56 },
      3: { cellWidth: 96, halign: "right" },
      4: { cellWidth: 96, halign: "right" },
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
        sanitizeDisplayText(purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName),
        formatCurrency(selectedProposal?.quotedPrice ?? purchaseOrder.amount),
        sanitizeDisplayText(selectedProposal?.leadTime ?? "-"),
        sanitizeDisplayText(selectedProposal?.paymentTerms ?? "-"),
        sanitizeDisplayText(selectedProposal?.notes ?? "-", { maxLength: 120 }),
      ],
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: TABLE_FONT_SIZE,
      cellPadding: 3,
      textColor: [15, 23, 42],
      overflow: "linebreak",
      lineWidth: 0.1,
      valign: "top",
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 90, halign: "right" },
      2: { cellWidth: 78 },
      3: { cellWidth: 92 },
      4: { cellWidth: 143 },
    },
  });

  doc.save(`PO-${poNumber}.pdf`);
}
