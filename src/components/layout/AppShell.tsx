"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageHeaderProvider } from "@/components/layout/PageHeaderContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { canAccessPath, getDefaultRouteForRole } from "@/lib/route-access";
import { loadFromStorage, saveToStorage } from "@/lib/storage";
import { useProcurementStore } from "@/store/useProcurementStore";

interface AppShellProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = "ht-sidebar-collapsed";

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(() => useProcurementStore.persist.hasHydrated());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return loadFromStorage<boolean>(SIDEBAR_COLLAPSED_STORAGE_KEY, false);
  });
  const isAuthenticated = useProcurementStore((state) => state.isAuthenticated);
  const currentRole = useProcurementStore((state) => state.currentRole);
  const initializeData = useProcurementStore((state) => state.initializeData);
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    const unsubscribe = useProcurementStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    saveToStorage(SIDEBAR_COLLAPSED_STORAGE_KEY, isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated && !isLoginRoute) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isLoginRoute) {
      router.replace(getDefaultRouteForRole(currentRole));
      return;
    }

    if (isAuthenticated && !isLoginRoute && !canAccessPath(currentRole, pathname)) {
      router.replace(getDefaultRouteForRole(currentRole));
    }
  }, [currentRole, hasHydrated, isAuthenticated, isLoginRoute, pathname, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      return;
    }

    void initializeData();
  }, [hasHydrated, initializeData, isAuthenticated]);

  if (!hasHydrated) {
    return <div className="min-h-screen bg-[var(--background)]" />;
  }

  if (!isAuthenticated) {
    return isLoginRoute ? <>{children}</> : <div className="min-h-screen bg-[var(--background)]" />;
  }

  if (isLoginRoute) {
    return <div className="min-h-screen bg-[var(--background)]" />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <PageHeaderProvider>
            <Topbar />
            <main className="flex-1 px-4 py-5 sm:px-6 lg:px-7 xl:px-8">
              <div className="mx-auto w-full max-w-[1520px] pb-10">{children}</div>
            </main>
          </PageHeaderProvider>
        </div>
      </div>
    </div>
  );
}
