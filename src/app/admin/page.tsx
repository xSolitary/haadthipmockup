"use client";

import { PageHeader } from "@/components/ui/PageHeader";

const cards = [
  { title: "Approval Flow Settings", description: "กำหนดลำดับการอนุมัติและระดับการอนุมัติของระบบ" },
  { title: "Cost Center Settings", description: "จัดการรหัส Cost Center สำหรับฝ่ายต่าง ๆ และโครงการ" },
  { title: "Plant / Site Settings", description: "ตั้งค่าไซต์ โรงงาน และพื้นที่กระจายสินค้า" },
  { title: "Vendor Master Sync", description: "สภาพการเชื่อมต่อกับฐานข้อมูลผู้ขายและสถานะการซิงค์" },
  { title: "User Role Management", description: "จัดการสิทธิ์ผู้ใช้งานและบทบาทสำหรับระบบ" },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Admin Settings" subtitle="พื้นที่จัดเก็บสำหรับการตั้งค่าระบบและการจัดการองค์กร" />
      <div className="grid gap-6 xl:grid-cols-2">
        {cards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{card.description}</p>
            <button type="button" className="mt-6 inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
              View settings
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
