import type { Role } from "@/lib/types";

export interface MockAccount {
  username: string;
  password: string;
  role: Extract<Role, "Requester" | "Approver" | "Purchasing" | "Finance" | "Vendor">;
  labelTh: string;
  labelEn: string;
  name: string;
  subtitle: string;
}

export const mockAccounts: MockAccount[] = [
  {
    username: "requester",
    password: "demo123",
    role: "Requester",
    labelTh: "ผู้ขอซื้อ",
    labelEn: "Requester",
    name: "นายสมชาย ศรีสม",
    subtitle: "ฝ่ายผลิต",
  },
  {
    username: "approver",
    password: "demo123",
    role: "Approver",
    labelTh: "ผู้อนุมัติ",
    labelEn: "Approver",
    name: "นางสาวปัทมา วัฒนสุข",
    subtitle: "ผู้จัดการอนุมัติ",
  },
  {
    username: "purchasing",
    password: "demo123",
    role: "Purchasing",
    labelTh: "ฝ่ายจัดซื้อ",
    labelEn: "Purchasing",
    name: "นายวรพันธ์ นิ่มนวล",
    subtitle: "Procurement Team",
  },
  {
    username: "finance",
    password: "demo123",
    role: "Finance",
    labelTh: "การเงิน",
    labelEn: "Finance",
    name: "นางสาวจารุวรรณ ชัยวงศ์",
    subtitle: "Finance",
  },
  {
    username: "vendor",
    password: "demo123",
    role: "Vendor",
    labelTh: "ร้านค้า",
    labelEn: "Vendor",
    name: "บริษัท Vendor Demo จำกัด",
    subtitle: "ร้านค้า / Supplier",
  },
];

export function findMockAccount(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  return mockAccounts.find(
    (account) => account.username === normalizedUsername && account.password === password,
  );
}
