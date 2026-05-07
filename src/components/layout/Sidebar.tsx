"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  Layers,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Procure-to-Pay", href: "/my-requests", icon: Layers },
  { label: "Vendor Selection", href: "/pr-po", icon: ShoppingBag },
  { label: "Receiving & QC", href: "/receiving", icon: Truck },
  { label: "Payment", href: "/payment", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Admin Settings", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">
      <div className="mb-10 flex items-center gap-3 rounded-3xl bg-[#007946] px-4 py-4 text-white shadow-lg shadow-green-200/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white">
          HT
        </div>
        <div>
          <p className="text-xs font-semibold text-green-100">HaadThip</p>
          <h1 className="text-base font-semibold leading-tight">Procurement Portal</h1>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#f0f9f6] text-[#007946]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
