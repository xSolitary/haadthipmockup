"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Home,
  Layers,
  Settings,
  Truck,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Procure-to-Pay", href: "/my-requests", icon: Layers },
  { label: "Receiving & QC", href: "/receiving", icon: Truck },
  { label: "Payment", href: "/payment", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Admin Settings", href: "/admin", icon: Settings },
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

  return (
    <aside className="sticky top-0 hidden h-screen min-h-screen w-[308px] shrink-0 border-r border-[var(--border)] bg-[rgba(250,248,243,0.82)] px-5 py-5 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col">
        <div className="px-3 py-4">
          <HaadthipWordmark />
        </div>

        <div className="mt-2 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Main
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
      </div>
    </aside>
  );
}
