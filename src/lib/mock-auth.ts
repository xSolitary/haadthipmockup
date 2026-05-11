import type { Role } from "@/lib/types";

export interface MockAccount {
  username: string;
  password: string;
  role: Extract<Role, "Requester" | "Approver" | "Purchasing" | "Finance">;
  labelTh: string;
}

export const mockAccounts: MockAccount[] = [
  {
    username: "requester",
    password: "demo123",
    role: "Requester",
    labelTh: "ผู้ขอซื้อ",
  },
  {
    username: "approver",
    password: "demo123",
    role: "Approver",
    labelTh: "ผู้อนุมัติ",
  },
  {
    username: "purchasing",
    password: "demo123",
    role: "Purchasing",
    labelTh: "จัดซื้อ",
  },
  {
    username: "finance",
    password: "demo123",
    role: "Finance",
    labelTh: "การเงิน",
  },
];

export function findMockAccount(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  return mockAccounts.find(
    (account) =>
      account.username === normalizedUsername &&
      account.password === password,
  );
}
