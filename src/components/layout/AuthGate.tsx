"use client";

import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, ShieldCheck, ShoppingCart } from "lucide-react";
import { useProcurementStore } from "@/store/useProcurementStore";
import type { Role } from "@/lib/types";

const roleCards: Array<{
  role: Extract<Role, "Requester" | "Approver" | "Purchasing">;
  title: string;
  subtitle: string;
  icon: typeof BriefcaseBusiness;
}> = [
  {
    role: "Requester",
    title: "Requester",
    subtitle: "Create memos and track PR / PO progress",
    icon: BriefcaseBusiness,
  },
  {
    role: "Approver",
    title: "Approver",
    subtitle: "Review requests and confirm vendor decisions",
    icon: ShieldCheck,
  },
  {
    role: "Purchasing",
    title: "Purchasing",
    subtitle: "Propose vendors and progress PR to PO",
    icon: ShoppingCart,
  },
];

export function AuthGate() {
  const router = useRouter();
  const loginAsRole = useProcurementStore((state) => state.loginAsRole);

  const handleSelectRole = (role: Extract<Role, "Requester" | "Approver" | "Purchasing">) => {
    loginAsRole(role);
    router.replace("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(0,121,70,0.18),_transparent_30%),linear-gradient(180deg,_#f7faf8_0%,_#edf5f0_100%)] px-6 py-10">
      <div className="absolute inset-x-0 top-0 h-28 border-b border-white/70 bg-white/70 backdrop-blur-md" />
      <div className="absolute left-8 top-4 flex items-center gap-3 rounded-[28px] bg-[#007946] px-5 py-4 text-white shadow-lg shadow-green-900/15">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 font-bold">HT</div>
        <div>
          <p className="text-xs font-semibold text-green-100">HaadThip</p>
          <p className="text-sm font-semibold">Procurement Portal</p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl rounded-[36px] border border-white/80 bg-white/88 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-3 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#007946]">Permission</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Choose your working role</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Select a mock role to enter the portal. The selection is stored locally and keeps the existing demo data intact.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f0f9f6] px-4 py-2 text-sm font-medium text-[#007946]">
            <CheckCircle2 className="h-4 w-4" />
            Mock login only
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {roleCards.map(({ role, title, subtitle, icon: Icon }, index) => {
            const highlighted = index === 1;

            return (
              <button
                key={role}
                type="button"
                onClick={() => handleSelectRole(role)}
                className={`group min-h-[240px] rounded-[30px] border p-8 text-left transition duration-200 ${
                  highlighted
                    ? "border-[#007946] bg-[#0abf63] text-white shadow-[0_20px_50px_rgba(0,121,70,0.22)]"
                    : "border-slate-200 bg-[#f9fcfa] text-slate-900 hover:border-[#007946]/35 hover:bg-[#f0f9f6]"
                }`}
              >
                <div className={`inline-flex rounded-2xl p-3 ${highlighted ? "bg-white/15" : "bg-white text-[#007946] shadow-sm shadow-slate-200"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-16">
                  <h2 className="text-[2rem] font-semibold">{title}</h2>
                  <p className={`mt-3 max-w-xs text-sm ${highlighted ? "text-white/85" : "text-slate-500"}`}>{subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
