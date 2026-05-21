"use client";

import Link from "next/link";
import { ArrowRight, Settings, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const cards = [
  {
    title: "ตั้งค่าระบบ",
    description: "กำหนดค่า workflow, cost center, site และการเชื่อมต่อข้อมูลหลักของระบบ",
    href: "/admin",
    icon: Settings,
  },
  {
    title: "ระบบจัดการผู้ใช้",
    description: "จัดการผู้ใช้งานในระบบและดูภาพรวมสิทธิ์การเข้าถึงตาม role",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "สิทธิ์การใช้งาน",
    description: "ตรวจสอบ role ที่เปิดใช้งานและขอบเขตเมนูที่แต่ละบทบาทสามารถเข้าถึงได้",
    href: "/admin/users",
    icon: ShieldCheck,
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าระบบ"
        subtitle="พื้นที่สำหรับผู้ดูแลระบบในการกำหนดค่าระบบและดูแลสิทธิ์การเข้าถึง"
      />
      <div className="grid gap-6 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-[#007946]/20 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex rounded-2xl bg-[var(--surface-tint)] p-3 text-[var(--primary)]">
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
              </div>
              <h2 className="mt-10 text-lg font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
