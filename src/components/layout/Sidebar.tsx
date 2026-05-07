"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  Layers,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Procure-to-Pay", href: "/my-requests", icon: Layers },
  { label: "Receiving & QC", href: "/receiving", icon: Truck },
  { label: "Payment", href: "/payment", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Admin Settings", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen min-h-screen w-[292px] shrink-0 border-r border-slate-200/90 bg-white/95 px-5 py-5 backdrop-blur lg:block">
      <div className="mb-8 rounded-[28px] border border-emerald-800/10 bg-gradient-to-br from-[#007946] via-[#007946] to-[#0a8f57] p-4 text-white shadow-[0_18px_40px_rgba(0,121,70,0.18)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white ring-1 ring-white/15">
            HT
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-50/80">HaadThip</p>
            <h1 className="text-base font-semibold leading-tight">Procurement Portal</h1>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-white/10 px-3 py-2 text-xs text-emerald-50/90">
          Enterprise procurement workspace
        </div>
      </div>
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border border-[#007946]/10 bg-[#f0f9f6] text-[#007946] shadow-sm"
                  : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive ? "bg-white text-[#007946] shadow-sm" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#007946]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
