import type { ProcurementCategory, Role } from "@/lib/types";

const statusLabelMap: Record<string, string> = {
  Draft: "Draft",
  Pending: "รอดำเนินการ",
  "Pending Approval": "รออนุมัติ",
  Submitted: "ส่งแล้ว",
  Approved: "อนุมัติแล้ว",
  Rejected: "ปฏิเสธแล้ว",
  "Revision Required": "ขอแก้ไข",
  "Converted to PR": "แปลงเป็น PR แล้ว",
  "PR Created": "สร้าง PR แล้ว",
  "Waiting for Purchasing to Propose Vendors": "รอฝ่ายจัดซื้อเสนอ Vendor",
  "Pending PR Approval": "รออนุมัติ PR",
  "Pending Vendor Approval": "รอหัวหน้าเลือก Vendor",
  "Vendor Approved": "อนุมัติ Vendor แล้ว",
  "PO Created": "สร้าง PO แล้ว",
  "Pending Receiving": "รอรับสินค้า",
  Received: "รับสินค้าแล้ว",
  "Pending PO Approval": "รออนุมัติ PO",
  "PO Approved": "อนุมัติ PO แล้ว",
  "PO Rejected": "ปฏิเสธ PO แล้ว",
  "Sent to Vendor": "ส่งให้ Vendor แล้ว",
  "QC Pending": "รอตรวจ QC",
  "QC Passed": "ผ่าน QC",
  "Vendor Selected": "เลือก Vendor แล้ว",
  "Payment Pending": "รอชำระเงิน",
  "Ready for AP Posting": "พร้อมลงรายการ AP",
  "Approved for Payment": "อนุมัติชำระเงินแล้ว",
  Paid: "ชำระเงินแล้ว",
  "Pending Invoice": "รอ Invoice",
};

const roleLabelMap: Record<Role, string> = {
  Requester: "ผู้ขอซื้อ",
  Approver: "ผู้อนุมัติ",
  Purchasing: "ฝ่ายจัดซื้อ",
  Finance: "การเงิน",
  Admin: "ผู้ดูแลระบบ",
};

const urgencyLabelMap: Record<string, string> = {
  Normal: "ปกติ",
  Urgent: "ด่วน",
  Emergency: "เร่งด่วน",
};

const categoryLabelMap: Record<ProcurementCategory, string> = {
  "Raw Material": "วัตถุดิบ",
  Packaging: "บรรจุภัณฑ์",
  "Spare Parts": "อะไหล่",
  "Factory Supplies": "วัสดุโรงงาน",
  "Marketing / POSM": "การตลาด / POSM",
  "Fleet / Vehicle": "ยานพาหนะ",
  "IT / Office": "IT / สำนักงาน",
  "Service / Contractor": "บริการ / ผู้รับเหมา",
};

const conditionLabelMap: Record<string, string> = {
  Good: "สมบูรณ์",
  Damaged: "ชำรุด",
  Partial: "ได้รับไม่ครบ",
};

export function getStatusLabel(label: string) {
  return statusLabelMap[label] ?? label;
}

export function getRoleLabel(role: Role) {
  return roleLabelMap[role] ?? role;
}

export function getUrgencyLabel(value: string) {
  return urgencyLabelMap[value] ?? value;
}

export function getCategoryLabel(value: ProcurementCategory) {
  return categoryLabelMap[value] ?? value;
}

export function getConditionLabel(value: string) {
  return conditionLabelMap[value] ?? value;
}
