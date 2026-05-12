"use client";

import { Bell, ChevronDown, LogOut, Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCurrentUserProfile } from "@/components/layout/useCurrentUserProfile";

export function Topbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentUser, currentUsername, initials, roleLabel, handleLogout } = useCurrentUserProfile();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(245,245,239,0.88)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex h-12 max-w-2xl flex-1 items-center rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-4 shadow-[var(--shadow-sm)]">
            <Search className="mr-3 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="ค้นหา Memo, PO, Vendor..."
              className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button className="hidden h-12 w-12 items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--surface)] text-slate-500 shadow-[var(--shadow-sm)] hover:border-[#007946]/15 hover:bg-[var(--surface-strong)] hover:text-[var(--primary)] sm:inline-flex">
            <Bell className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex min-h-12 items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-slate-700 shadow-[var(--shadow-sm)] hover:border-[#007946]/20 hover:bg-[var(--surface-strong)]"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#007946_0%,#2eaf72_100%)] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(0,121,70,0.2)]">
                {initials}
              </div>
              <div className="hidden min-w-0 text-left sm:block">
                <div className="truncate text-sm font-semibold leading-none text-slate-900">
                  {currentUser?.name ?? "HaadThip User"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] leading-none text-slate-500">
                  <span className="inline-flex rounded-full bg-[var(--surface-tint)] px-2 py-1 font-medium text-[var(--primary-ink)]">
                    {roleLabel}
                  </span>
                  <span className="truncate">{currentUser?.department ?? "จัดซื้อ"}</span>
                </div>
              </div>
              <ChevronDown
                className={`hidden h-4 w-4 text-slate-400 transition sm:block ${isMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[272px] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.96)] shadow-[var(--shadow-md)] backdrop-blur-xl">
                <div className="border-b border-[var(--border)] px-4 py-4">
                  <div className="text-sm font-semibold text-slate-900">{currentUser?.name ?? "HaadThip User"}</div>
                  <div className="mt-1 text-sm text-slate-500">{currentUsername ? `@${currentUsername}` : roleLabel}</div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-[var(--surface-tint)] hover:text-[var(--primary-ink)]"
                  >
                    <UserRound className="h-4 w-4" />
                    โปรไฟล์
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-[var(--surface-tint)] hover:text-[var(--primary-ink)]"
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
