import { describe, expect, it } from "vitest";
import {
  ValidationError,
  validateMemoPayload,
  validateVendorProposalPayload,
} from "@/lib/procurement-validation";

function createMemoPayload() {
  return {
    requesterId: "u-requester",
    requesterName: "Requester",
    department: "Production",
    costCenter: "CC-01",
    site: "Hat Yai Plant" as const,
    requestDate: "2026-05-27",
    requiredDate: "2026-06-03",
    title: "Packaging request",
    category: "Packaging" as const,
    purpose: "Restock packaging materials",
    budgetCode: "BUD-01",
    urgency: "Normal" as const,
    deliveryLocation: "Warehouse A",
    attachments: ["quote.pdf"],
    budgetRemaining: 500_000,
    items: [
      {
        id: "item-1",
        name: "Bottle caps",
        quantity: 100,
        unit: "pcs",
        unitPrice: 12.5,
        category: "Packaging" as const,
      },
    ],
  };
}

function createVendorProposalPayload() {
  return {
    vendorId: null,
    vendorName: "Vendor A",
    quotedPrice: 12_500,
    leadTime: "7 วัน",
    paymentTerms: "Credit 30 days",
    notes: "Ready stock",
    attachmentName: undefined,
    attachmentUrl: undefined,
    submittedToApprover: false,
  };
}

describe("procurement validation", () => {
  it("rejects memo items with zero price", () => {
    expect(() =>
      validateMemoPayload({
        ...createMemoPayload(),
        items: [
          {
            ...createMemoPayload().items[0],
            unitPrice: 0,
          },
        ],
      }),
    ).toThrow(ValidationError);
  });

  it("rejects memo item quantities that are not integers", () => {
    expect(() =>
      validateMemoPayload({
        ...createMemoPayload(),
        items: [
          {
            ...createMemoPayload().items[0],
            quantity: 1.5,
          },
        ],
      }),
    ).toThrow("จำนวนต้องเป็นจำนวนเต็ม");
  });

  it("rejects memo required dates more than one year ahead", () => {
    expect(() =>
      validateMemoPayload({
        ...createMemoPayload(),
        requiredDate: "2027-05-28",
      }),
    ).toThrow("วันที่ต้องการใช้ต้องไม่เกิน 1 ปีนับจากวันที่ขอ");
  });

  it("rejects memo totals above one million baht", () => {
    expect(() =>
      validateMemoPayload({
        ...createMemoPayload(),
        items: [
          {
            ...createMemoPayload().items[0],
            quantity: 100_000,
            unitPrice: 15,
          },
        ],
      }),
    ).toThrow("มูลค่ารวมต้องไม่เกิน 1,000,000 บาท");
  });

  it("rounds memo prices to two decimal places", () => {
    const validated = validateMemoPayload({
      ...createMemoPayload(),
      items: [
        {
          ...createMemoPayload().items[0],
          unitPrice: 10.129,
        },
      ],
    });

    expect(validated.items[0]?.unitPrice).toBe(10.13);
  });

  it("rejects vendor proposals with zero price", () => {
    expect(() =>
      validateVendorProposalPayload({
        ...createVendorProposalPayload(),
        quotedPrice: 0,
      }),
    ).toThrow(ValidationError);
  });

  it("rejects negative vendor lead time", () => {
    expect(() =>
      validateVendorProposalPayload({
        ...createVendorProposalPayload(),
        leadTime: "-3 วัน",
      }),
    ).toThrow("Lead time ต้องไม่ติดลบ");
  });
});
