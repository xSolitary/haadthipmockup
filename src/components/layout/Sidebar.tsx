"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  Layers,
  LogOut,
  Settings,
  Truck,
} from "lucide-react";
import { useCurrentUserProfile } from "@/components/layout/useCurrentUserProfile";
import { useProcurementStore } from "@/store/useProcurementStore";

const defaultNavItems = [
  { label: "แดชบอร์ด", href: "/", icon: Home },
  { label: "ระบบจัดซื้อ", href: "/my-requests", icon: Layers },
  { label: "ตรวจรับสินค้า", href: "/receiving", icon: Truck },
  { label: "จ่ายเงิน", href: "/payment", icon: CreditCard },
  { label: "รายงาน", href: "/reports", icon: BarChart3 },
  { label: "ตั้งค่าระบบ", href: "/admin", icon: Settings },
];

const vendorNavItems = [
  { label: "PO / งานจัดส่ง", href: "/my-requests?tab=po", icon: Layers },
  { label: "ตรวจรับสินค้า", href: "/receiving", icon: Truck },
];

function HaadthipWordmark({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#007946]/12 bg-white/90 shadow-[var(--shadow-sm)]">
        <span
          className="text-lg font-bold uppercase leading-none tracking-[-0.08em] text-[#007946]"
          style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
        >
          H
        </span>
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#ef2b2d]" />
      </div>
    );
  }

  return (
    <div className="relative inline-flex min-w-0 shrink items-center overflow-hidden whitespace-nowrap">
      <span
        className="block truncate text-[1.8rem] font-bold uppercase leading-none tracking-[-0.05em] text-[#007946]"
        style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
      >
        HAADTHIP
      </span>
      <span className="absolute right-[2.55rem] top-0.5 h-2.5 w-2.5 rounded-full bg-[#ef2b2d]" />
    </div>
  );
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = useProcurementStore((state) => state.currentRole);
  const { currentUser, initials, roleLabel, handleLogout } = useCurrentUserProfile();
  const navItems = currentRole === "Vendor" ? vendorNavItems : defaultNavItems;

  return (
    <aside
      className={`sticky top-0 hidden h-screen min-h-screen shrink-0 border-r border-[var(--border)] bg-[rgba(250,248,243,0.82)] py-5 backdrop-blur-xl transition-[width,padding] duration-300 lg:block ${
        isCollapsed ? "w-[88px] px-2.5" : "w-[308px] px-5"
      }`}
    >
      <div className="flex h-full flex-col">
        <div
          className={`py-4 ${
            isCollapsed ? "flex flex-col items-center gap-3 px-0" : "flex items-center justify-between gap-3 px-3"
          }`}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/85 text-slate-500 shadow-[var(--shadow-sm)] transition hover:border-[#007946]/20 hover:bg-[var(--surface-strong)] hover:text-[var(--primary)]"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <div className={`flex min-w-0 items-center ${isCollapsed ? "justify-center" : "flex-1"}`}>
            <HaadthipWordmark isCollapsed={isCollapsed} />
          </div>
        </div>

        {!isCollapsed ? (
          <div className="mt-2 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">เมนูหลัก</p>
          </div>
        ) : null}

        <nav className="mt-3 flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href.includes("?")
                ? pathname === item.href.split("?")[0]
                : pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center rounded-[22px] px-4 py-3.5 text-sm font-medium transition ${
                  isActive
                    ? "border border-[#007946]/10 bg-[var(--surface-strong)] text-[var(--primary-ink)] shadow-[var(--shadow-sm)]"
                    : "border border-transparent text-slate-600 hover:border-[var(--border)] hover:bg-white/70 hover:text-slate-900"
                } ${isCollapsed ? "justify-center px-2.5" : "gap-3"}`}
                title={item.label}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                    isActive
                      ? "bg-[var(--surface-tint)] text-[var(--primary)]"
                      : "bg-white/70 text-slate-500 group-hover:bg-[var(--surface-strong)] group-hover:text-[var(--primary)]"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {!isCollapsed ? <div className="min-w-0">{item.label}</div> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-4">
          <div
            className={`rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.9)] shadow-[var(--shadow-md)] ${
              isCollapsed ? "p-2" : "p-3"
            }`}
          >
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#007946_0%,#2eaf72_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,121,70,0.2)]">
                {initials}
              </div>
              {!isCollapsed ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {currentUser?.name ?? "HaadThip User"}
                    </div>
                    <div className="mt-1 truncate text-xs text-slate-500">{roleLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-slate-500 shadow-[var(--shadow-sm)] hover:border-[#007946]/20 hover:bg-[var(--surface-tint)] hover:text-[var(--primary)]"
                    aria-label="ออกจากระบบ"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
