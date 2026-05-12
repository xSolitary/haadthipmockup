"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Home, Layers, LogOut, Settings, Truck } from "lucide-react";
import { useCurrentUserProfile } from "@/components/layout/useCurrentUserProfile";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Procure-to-Pay", href: "/my-requests", icon: Layers },
  { label: "Receiving & QC", href: "/receiving", icon: Truck },
  { label: "Payment", href: "/payment", icon: CreditCard },
  { label: "รายงาน", href: "/reports", icon: BarChart3 },
  { label: "ตั้งค่าระบบ", href: "/admin", icon: Settings },
];

function HaadthipWordmark() {
  return (
    <div className="relative inline-block">
      <span
        className="block text-[2.6rem] font-bold uppercase leading-none tracking-[-0.06em] text-[#007946]"
        style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
      >
        HAADTHIP
      </span>
      <span className="absolute right-[3.7rem] top-0.5 h-3.5 w-3.5 rounded-full bg-[#ef2b2d]" />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, initials, roleLabel, handleLogout } = useCurrentUserProfile();

  return (
    <aside className="sticky top-0 hidden h-screen min-h-screen w-[308px] shrink-0 border-r border-[var(--border)] bg-[rgba(250,248,243,0.82)] px-5 py-5 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col">
        <div className="px-3 py-4">
          <HaadthipWordmark />
        </div>

        <div className="mt-2 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            เมนูหลัก
          </p>
        </div>

        <nav className="mt-3 flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-medium transition ${
                  isActive
                    ? "border border-[#007946]/10 bg-[var(--surface-strong)] text-[var(--primary-ink)] shadow-[var(--shadow-sm)]"
                    : "border border-transparent text-slate-600 hover:border-[var(--border)] hover:bg-white/70 hover:text-slate-900"
                }`}
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
                <div className="min-w-0">
                  <div>{item.label}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-4">
          <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.9)] p-3 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#007946_0%,#2eaf72_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,121,70,0.2)]">
                {initials}
              </div>
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
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
