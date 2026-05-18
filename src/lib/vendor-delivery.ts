import type { PurchaseOrder, VendorDeliveryStatus, VendorDeliveryUpdate } from "@/lib/types";

export const vendorDeliveryStatuses: VendorDeliveryStatus[] = [
  "รับคำสั่งซื้อแล้ว",
  "กำลังเตรียมสินค้า",
  "อยู่ระหว่างจัดส่ง",
  "จัดส่งถึงปลายทางแล้ว",
];

export const deliveredVendorStatus: VendorDeliveryStatus = "จัดส่งถึงปลายทางแล้ว";

export function mergePurchaseOrderWithVendorDelivery(
  purchaseOrder: PurchaseOrder,
  vendorDeliveries: Record<string, VendorDeliveryUpdate>,
): PurchaseOrder {
  const delivery = vendorDeliveries[purchaseOrder.id];
  if (!delivery) {
    return purchaseOrder;
  }

  return {
    ...purchaseOrder,
    vendorDeliveryStatus: delivery.vendorDeliveryStatus,
    vendorDeliveryNote: delivery.vendorDeliveryNote,
    trackingNumber: delivery.trackingNumber,
    expectedDeliveryDate: delivery.expectedDeliveryDate,
    deliveredAt: delivery.deliveredAt,
    vendorUpdatedAt: delivery.vendorUpdatedAt,
    vendorName: delivery.vendorName ?? purchaseOrder.selectedVendorName ?? purchaseOrder.vendorName,
  };
}

export function isReceivingEnabled(purchaseOrder: PurchaseOrder) {
  return purchaseOrder.vendorDeliveryStatus === deliveredVendorStatus;
}

export function formatVendorUpdateTimestamp(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function getVendorTimeline(purchaseOrder: PurchaseOrder) {
  const events: Array<{ label: string; date?: string; complete: boolean }> = [
    {
      label: "เลือก Vendor และสร้าง PO",
      date: purchaseOrder.updatedAt,
      complete: Boolean(purchaseOrder.selectedVendorName),
    },
  ];

  vendorDeliveryStatuses.forEach((status) => {
    const isCurrent = purchaseOrder.vendorDeliveryStatus === status;
    const isDelivered = status === deliveredVendorStatus && Boolean(purchaseOrder.deliveredAt);
    events.push({
      label: status,
      date: isDelivered ? purchaseOrder.deliveredAt : isCurrent ? purchaseOrder.vendorUpdatedAt : undefined,
      complete: isCurrent || isDelivered,
    });
  });

  return events;
}
