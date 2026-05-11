"use client";

import { LogOut, Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useProcurementStore } from "@/store/useProcurementStore";

export function Topbar() {
  const router = useRouter();
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const currentUsername = useProcurementStore((state) => state.currentUsername);
  const users = useProcurementStore((state) => state.users);
  const logout = useProcurementStore((state) => state.logout);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0],
    [currentUserId, users],
  );

  const initials = useMemo(() => {
    if (!currentUser?.name) {
      return "HT";
    }

    return currentUser.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(245,245,239,0.88)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex h-12 max-w-2xl flex-1 items-center rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 shadow-[var(--shadow-sm)]">
            <Search className="mr-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="ค้นหา Memo, PO, ผู้ขาย..."
              className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button className="hidden h-12 w-12 items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--surface)] text-slate-500 shadow-[var(--shadow-sm)] hover:border-[#007946]/15 hover:bg-[var(--surface-strong)] hover:text-[var(--primary)] sm:inline-flex">
            <Bell className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-slate-700 shadow-[var(--shadow-sm)] hover:border-[#007946]/20 hover:bg-[var(--surface-strong)] hover:text-[var(--primary)]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout / Change Account</span>
          </button>
          <div className="flex min-h-12 items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-slate-700 shadow-[var(--shadow-sm)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#007946_0%,#2eaf72_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,121,70,0.2)]">
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate text-sm font-semibold leading-none text-slate-900">{currentUser?.name ?? "HaadThip User"}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] leading-none text-slate-500">
                <span className="inline-flex rounded-full bg-[var(--surface-tint)] px-2 py-1 font-medium text-[var(--primary-ink)]">
                  {currentRole}
                </span>
                {currentUsername ? <span className="truncate">@{currentUsername}</span> : null}
                <span className="truncate">{currentUser?.department ?? "Procurement"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
