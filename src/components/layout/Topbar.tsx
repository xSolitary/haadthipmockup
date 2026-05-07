"use client";

import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useMemo } from "react";
import { useProcurementStore } from "@/store/useProcurementStore";

export function Topbar() {
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const users = useProcurementStore((state) => state.users);
  const logout = useProcurementStore((state) => state.logout);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0],
    [currentUserId, users],
  );

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/95 px-6 shadow-sm shadow-slate-100 backdrop-blur">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex max-w-lg flex-1 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="mr-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="ค้นหา Memo, PO, ผู้ขาย..."
            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 sm:flex">
          <Bell className="h-4 w-4" />
          การแจ้งเตือน
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 xl:block">
          บริษัท หาดทิพย์ จำกัด
        </div>
        <div className="rounded-full bg-[#f0f9f6] px-4 py-2 text-sm font-semibold text-[#007946]">
          {currentRole}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300">
          <UserCircle className="h-5 w-5 text-[#007946]" />
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">{currentUser.name}</div>
            <div className="text-xs text-slate-500">{currentUser.department}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#007946]/30 hover:bg-[#f0f9f6] hover:text-[#007946]"
        >
          <LogOut className="h-4 w-4" />
          Switch Role
        </button>
      </div>
    </header>
  );
}
