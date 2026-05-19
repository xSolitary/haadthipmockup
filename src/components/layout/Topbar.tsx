"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  FileWarning,
  LogOut,
  Search,
  Siren,
  Truck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePageHeaderContext } from "@/components/layout/PageHeaderContext";
import { useCurrentUserProfile } from "@/components/layout/useCurrentUserProfile";
import { getActionNotifications, type NotificationIconKey } from "@/lib/notifications";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { mergePurchaseOrderWithVendorDelivery } from "@/lib/vendor-delivery";
import { useProcurementStore } from "@/store/useProcurementStore";

const NOTIFICATION_READ_STORAGE_KEY = "ht-notification-read-state";

type NotificationReadState = Record<string, string>;

function NotificationIcon({ icon }: { icon: NotificationIconKey }) {
  switch (icon) {
    case "revision":
      return <FileWarning className="h-4 w-4" />;
    case "rejected":
      return <CircleAlert className="h-4 w-4" />;
    case "urgent":
      return <Siren className="h-4 w-4" />;
    case "memo-approval":
    case "vendor-approval":
      return <ClipboardCheck className="h-4 w-4" />;
    case "delivery-update":
    case "delivery-arrived":
      return <Truck className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

export function Topbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readState, setReadState] = useState<NotificationReadState>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return loadFromStorage<NotificationReadState>(NOTIFICATION_READ_STORAGE_KEY, {});
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { pageHeader } = usePageHeaderContext();
  const { currentUser, currentUsername, initials, roleLabel, handleLogout } = useCurrentUserProfile();
  const currentRole = useProcurementStore((state) => state.currentRole);
  const currentUserId = useProcurementStore((state) => state.currentUserId);
  const memos = useProcurementStore((state) => state.memos);
  const purchaseOrders = useProcurementStore((state) => state.purchaseOrders);
  const vendorDeliveries = useProcurementStore((state) => state.vendorDeliveries);
  const mergedPurchaseOrders = useMemo(
    () => purchaseOrders.map((po) => mergePurchaseOrderWithVendorDelivery(po, vendorDeliveries)),
    [purchaseOrders, vendorDeliveries],
  );
  const notificationScopeKey = currentRole && currentUserId ? `${currentRole}:${currentUserId}` : null;
  const clearedAt = notificationScopeKey ? readState[notificationScopeKey] : undefined;
  const notifications = getActionNotifications({
    currentRole,
    currentUserId,
    memos,
    purchaseOrders: mergedPurchaseOrders,
  }).filter(
    (notification) => !clearedAt || new Date(notification.timestamp).getTime() > new Date(clearedAt).getTime(),
  );
  const notificationCount = notifications.length;
  const activePageHeader = pageHeader?.pathname === pathname ? pageHeader : null;

  useEffect(() => {
    if (!isMenuOpen && !isNotificationOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, isNotificationOpen]);

  const handleMarkAllAsRead = () => {
    if (!notificationScopeKey) {
      setIsNotificationOpen(false);
      return;
    }

    const nextState = {
      ...readState,
      [notificationScopeKey]: new Date().toISOString(),
    };

    setReadState(nextState);
    saveToStorage(NOTIFICATION_READ_STORAGE_KEY, nextState);
    setIsNotificationOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(245,245,239,0.88)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-7 xl:px-8">
      <div className="flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:gap-5">
        <div className="min-w-0 flex-1">
          {activePageHeader ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
              <div className="min-w-0">
                <p className="inline-flex rounded-full bg-[var(--surface-tint)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[var(--primary-ink)]">
                  {activePageHeader.badge ?? "ระบบงาน"}
                </p>
                <h1 className="mt-2 truncate text-lg font-semibold text-slate-900 sm:text-xl">
                  {activePageHeader.title}
                </h1>
                {activePageHeader.subtitle ? (
                  <p className="mt-1 max-w-3xl text-xs text-slate-500 sm:text-sm">
                    {activePageHeader.subtitle}
                  </p>
                ) : null}
              </div>
              {activePageHeader.actions ? <div className="min-w-0 lg:shrink-0">{activePageHeader.actions}</div> : null}
            </div>
          ) : null}
        </div>

        <div
          className="ml-auto flex w-full min-w-0 flex-wrap items-center justify-end gap-2.5 xl:w-auto xl:max-w-[56rem] xl:flex-nowrap"
          ref={menuRef}
        >
          <div className="relative hidden h-11 min-w-0 flex-1 items-center rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-4 shadow-[var(--shadow-sm)] md:flex md:max-w-[220px] lg:max-w-[260px]">
            <Search className="mr-3 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="search"
              placeholder="ค้นหา Memo, PO, Vendor..."
              className="w-full min-w-0 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="relative shrink-0" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen((open) => !open);
                setIsMenuOpen(false);
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-[20px] border border-[var(--border)] bg-[var(--surface)] text-slate-500 shadow-[var(--shadow-sm)] transition hover:border-[#007946]/15 hover:bg-[var(--surface-strong)] hover:text-[var(--primary)]"
              aria-haspopup="dialog"
              aria-expanded={isNotificationOpen}
              aria-label="การแจ้งเตือน"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#d92d20] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-[0_8px_16px_rgba(217,45,32,0.25)]">
                  {notificationCount}
                </span>
              ) : null}
            </button>

            {isNotificationOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[32px] border border-[#d9e8de] bg-white shadow-[0_28px_60px_rgba(15,23,42,0.16)]">
                <div className="flex items-center justify-between border-b border-[#edf3ef] px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">การแจ้งเตือน</h2>
                    <p className="mt-1 text-xs text-slate-500">งานที่ต้องดำเนินการตามสิทธิ์ของคุณ</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-sm font-semibold text-[#007946] transition hover:text-[#005f37]"
                  >
                    อ่านทั้งหมด
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-slate-500">ไม่มีงานที่ต้องดำเนินการ</div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto px-3 py-3">
                    {notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => setIsNotificationOpen(false)}
                        className="flex items-start gap-3 rounded-[24px] px-3 py-3 transition hover:bg-[#f4fbf7]"
                      >
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef8f2] text-[#007946]">
                          <NotificationIcon icon={notification.icon} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{notification.title}</p>
                              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                                {notification.description}
                              </p>
                            </div>
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d92d20]" />
                          </div>
                          <p className="mt-2 text-xs font-medium text-slate-400">{notification.timeLabel}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {activePageHeader?.topbarControls ? (
            <div className="flex shrink-0 items-center gap-2.5">{activePageHeader.topbarControls}</div>
          ) : null}

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((open) => !open);
                setIsNotificationOpen(false);
              }}
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
                  <span className="truncate">{currentUser?.department ?? "ฝ่ายจัดซื้อ"}</span>
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
