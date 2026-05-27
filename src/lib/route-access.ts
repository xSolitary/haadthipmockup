import type { Role } from "@/lib/types";

export type NavItemConfig = {
  label: string;
  href: string;
  icon: "home" | "layers" | "truck" | "credit-card" | "bar-chart" | "settings" | "users";
};

const defaultNavItems: NavItemConfig[] = [
  { label: "แดชบอร์ด", href: "/", icon: "home" },
  { label: "ระบบจัดซื้อ", href: "/my-requests", icon: "layers" },
  { label: "ตรวจรับสินค้า", href: "/receiving", icon: "truck" },
  { label: "จ่ายเงิน", href: "/payment", icon: "credit-card" },
  { label: "รายงาน", href: "/reports", icon: "bar-chart" },
  { label: "ตั้งค่าระบบ", href: "/admin", icon: "settings" },
];

const vendorNavItems: NavItemConfig[] = [
  { label: "PO / งานจัดส่ง", href: "/my-requests?tab=po", icon: "layers" },
  { label: "ตรวจรับสินค้า", href: "/receiving", icon: "truck" },
];

const adminNavItems: NavItemConfig[] = [
  { label: "แดชบอร์ด", href: "/", icon: "home" },
  { label: "รายงาน", href: "/reports", icon: "bar-chart" },
  { label: "ตั้งค่าระบบ", href: "/admin", icon: "settings" },
  { label: "ระบบจัดการผู้ใช้", href: "/admin/users", icon: "users" },
];

export function getNavItemsForRole(role: Role): NavItemConfig[] {
  if (role === "Vendor") {
    return vendorNavItems;
  }

  if (role === "Admin") {
    return adminNavItems;
  }

  return defaultNavItems;
}

export function getDefaultRouteForRole(role: Role) {
  return role === "Vendor" ? "/my-requests?tab=po" : "/";
}

export function canAccessPath(role: Role, pathname: string) {
  if (pathname === "/login") {
    return true;
  }

  if (role === "Vendor") {
    const isVendorDeliveryActionPath = /^\/pr-po\/[^/]+\/action$/.test(pathname);
    return pathname === "/"
      ? false
      : pathname === "/my-requests" || pathname === "/receiving" || isVendorDeliveryActionPath;
  }

  if (role === "Admin") {
    return pathname === "/" || pathname === "/reports" || pathname === "/admin" || pathname === "/admin/users";
  }

  return pathname !== "/admin/users";
}
