"use client";

import { ReactNode } from "react";
import { AuthGate } from "@/components/layout/AuthGate";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useProcurementStore } from "@/store/useProcurementStore";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isAuthenticated = useProcurementStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
            <div className="mx-auto w-full max-w-[1480px] pb-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
