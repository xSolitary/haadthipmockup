"use client";

import { Bell, ChevronDown, Search, UserCircle } from "lucide-react";
import { useMemo } from "react";
import { useProcurementStore } from "@/store/useProcurementStore";
import type { Role } from "@/lib/types";

const roleOptions: { label: string; value: Role }[] = [
  { label: "Requester", value: "Requester" },
  { label: "Approver", value: "Approver" },
  { label: "Purchasing", value: "Purchasing" },
  { label: "Finance", value: "Finance" },
  { label: "Admin", value: "Admin" },
];

export function Topbar() {
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const users = useProcurementStore((state) => state.users);
  const switchRole = useProcurementStore((state) => state.switchRole);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0],
    [currentUserId, users],
  );

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 shadow-sm shadow-slate-100">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex flex-1 max-w-lg items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="mr-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="ค้นหา Memo, PO, ผู้ขอ..."
            className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <button className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-slate-300 sm:flex">
          <Bell className="h-4 w-4" />
          การแจ้งเตือน
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          บริษัท หาดทิพย์ จำกัด
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <label className="sr-only">Role</label>
          <select
            value={currentRole}
            onChange={(event) => switchRole(event.target.value as Role)}
            className="w-full appearance-none bg-transparent text-sm text-slate-700 outline-none"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300">
          <UserCircle className="h-5 w-5 text-[#007946]" />
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900">{currentUser.name}</div>
            <div className="text-xs text-slate-500">{currentUser.department}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
