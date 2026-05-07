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
    <header className="sticky top-0 z-20 flex min-h-[78px] shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 bg-[#f6f8fa]/95 px-4 shadow-sm shadow-slate-200/40 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex h-10 max-w-xl flex-1 items-center rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm shadow-slate-200/40">
          <Search className="mr-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="ค้นหา Memo, PO, ผู้ขาย..."
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-200/40 hover:border-[#007946]/20 hover:bg-[#f0f9f6] hover:text-[#007946] sm:inline-flex">
          <Bell className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm shadow-slate-200/40 xl:inline-flex">
          บริษัท หาดทิพย์ จำกัด
        </div>
        <div className="inline-flex h-10 items-center rounded-xl border border-[#007946]/10 bg-[#f0f9f6] px-3 text-sm font-semibold text-[#007946]">
          {currentRole}
        </div>
        <div className="flex h-10 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-sm shadow-slate-200/40 transition hover:border-slate-300">
          <UserCircle className="h-5 w-5 shrink-0 text-[#007946]" />
          <div className="text-left">
            <div className="text-sm font-semibold leading-none text-slate-900">{currentUser.name}</div>
            <div className="mt-1 text-[11px] leading-none text-slate-500">{currentUser.department}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/40 hover:border-[#007946]/30 hover:bg-[#f0f9f6] hover:text-[#007946]"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Switch Role</span>
        </button>
      </div>
    </header>
  );
}
